import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, Select, DatePicker, Radio, Button, Row, Col, Card, message, AutoComplete } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { getPlants, getClients, getProducts, createMultipleOrders, getLatestSalesOrder, getPrices } from '../../services/api';
import moment from 'moment';

const { Option } = Select;

const OrderForm = ({ order, onSave, onCancel, isReadOnly = false }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [depots, setDepots] = useState([]);
  const [clients, setClients] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [shipToOptions, setShipToOptions] = useState([]);
  const [prices, setPrices] = useState({});
  const [orderType, setOrderType] = useState('ZOR');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [depotsData, clientsData, productsData, pricesData] = await Promise.all([
          getPlants(),
          getClients(),
          getProducts(),
          getPrices()
        ]);
        setDepots(deduplicateData(depotsData.data, 'Plant Code'));
        setClients(clientsData.data);
        setAllProducts(deduplicateData(productsData.data, 'Material'));
        setPrices(formatPrices(pricesData.data));
        
        // Create shipToOptions
        const uniqueShipTo = new Set();
        clientsData.data.forEach(client => {
          uniqueShipTo.add(`${client['Customer Ship to']} - ${client['Customer ship to name']}`);
        });
        setShipToOptions(Array.from(uniqueShipTo).map(option => ({ value: option })));
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching form data:', error);
        message.error('Failed to load form data. Please try again.');
      }
    };
  
    fetchData();
  }, []);

  useEffect(() => {
    if (order) {
      const formData = {
        ...order,
        'Requested delivery date': order['Requested delivery date'] ? moment(order['Requested delivery date']) : null,
        depot: order.Plant,
        products: [{
          code: order['Material Code'],
          name: order['Material Name'],
          valuationType: order['Valution Type'],
          quantity: order['Order Qty'],
          uom: order['Sls.UOM'],
          price: order['Unit Price'] || 0
        }],
        order_type: order.order_type || 'VRAC'
      };
      form.setFieldsValue(formData);
      setOrderType(order['Order Type'] || 'ZOR');
      handleShipToChange(`${order['Ship To Party']} - ${order['Ship To Name']}`);
      filterProducts(order.order_type || 'VRAC');
    } else {
      form.setFieldsValue({ order_type: 'VRAC', "Order Type": 'ZOR' });
      filterProducts('VRAC');
    }
  }, [order, form, allProducts]);

  const deduplicateData = (data, key) => {
    const uniqueMap = new Map();
    data.forEach(item => {
      if (!uniqueMap.has(item[key])) {
        uniqueMap.set(item[key], item);
      }
    });
    return Array.from(uniqueMap.values());
  };

  const formatPrices = (pricesData) => {
    const formattedPrices = {};
    pricesData.forEach(price => {
      if (!formattedPrices[price['Ship to SAP']]) {
        formattedPrices[price['Ship to SAP']] = {};
      }
      formattedPrices[price['Ship to SAP']][price['SAP material']] = price['Price Unit (HT)'];
    });
    return formattedPrices;
  };

  const filterProducts = (orderType) => {
    const filtered = allProducts.filter(product => {
      const dfAtClientLevel = (product['DF at client level'] || '').toLowerCase();
      return orderType === 'PACK' ? dfAtClientLevel.includes('pack') : !dfAtClientLevel.includes('pack');
    });
    setFilteredProducts(filtered);
  };

  const handleOrderTypeChange = (e) => {
    const newOrderType = e.target.value;
    setOrderType(newOrderType);
    filterProducts(newOrderType);
    form.setFieldsValue({ 'Material Code': undefined });

    if (newOrderType === 'ZCON') {
      form.setFieldsValue({
        Customer: undefined,
        'Customer Name': undefined,
        'Ship To Party': undefined,
        'Ship To Name': undefined,
        'City(Ship To)': undefined,
        'Statut de droit': undefined,
        'Customer ship to Address': undefined
      });
    } else {
      form.setFieldsValue({
        Customer: undefined,
        'Customer Name': undefined,
        'Statut de droit': undefined
      });
    }
  };

  const handleShipToChange = (value) => {
    if (orderType !== 'ZCON') {
      const [shipToCode, shipToName] = value.split(' - ');
      const selectedClient = clients.find(client => 
        client['Customer Ship to'] === shipToCode && 
        client['Customer ship to name'] === shipToName
      );

      if (selectedClient) {
        form.setFieldsValue({
          'Ship To Party': shipToCode,
          'Ship To Name': shipToName,
          'City(Ship To)': selectedClient['Customer ship to city'],
          'Customer ship to Address': selectedClient['Customer ship to Address'],
          Customer: selectedClient['Customer Sold to'],
          'Customer Name': selectedClient['Customer Sold to name'],
          'Statut de droit': selectedClient['Statut de droit']
        });
      }
    }
    // Reset product prices when Ship To changes
    const products = form.getFieldValue('products');
    const updatedProducts = products.map(product => ({
      ...product,
      price: 0
    }));
    form.setFieldsValue({ products: updatedProducts });
  };

  const handleProductChange = useCallback((index, field, value) => {
    const selectedProduct = filteredProducts.find(product => 
      product['Material'] === value || product['Material description'] === value
    );
    if (selectedProduct) {
      const newProducts = form.getFieldValue('products');
      const shipTo = form.getFieldValue('Ship To Party');
      const price = prices[shipTo]?.[selectedProduct['Material']] || 0;
      
      newProducts[index] = {
        ...newProducts[index],
        code: selectedProduct['Material'],
        name: selectedProduct['Material description'],
        uom: selectedProduct['Base Unit of Measure'],
        price: orderType === 'ZCON' ? '' : price
      };
      form.setFieldsValue({ products: newProducts });

      if (price === 0 && orderType !== 'ZCON') {
        message.warning(`No price found for this product for the selected client. Please update the price data.`);
      }
    }
  }, [filteredProducts, form, prices, orderType]);

  const handleQuantityChange = (index, value) => {
    const products = form.getFieldValue('products');
    const updatedProducts = [...products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      quantity: value
    };
    form.setFieldsValue({ products: updatedProducts });
  };

  const handleDepotSelect = (value, option) => {
    form.setFieldsValue({ depot: value });
  };

  const onFinish = async (values) => {
    try {
      console.log('Form values:', values);
  
      let salesOrderNumber;
      if (order && order['Sales Order']) {
        salesOrderNumber = order['Sales Order'];
      } else {
        salesOrderNumber = await getLatestSalesOrder();
        salesOrderNumber += 1;
      }
  
      const ordersData = values.products.map((product, index) => {
        const baseOrderData = {
          'Sales Order': salesOrderNumber,
          'Order Type': values["Order Type"],
          Customer: values.Customer,
          'Customer Name': values["Customer Name"],
          Plant: values.depot,
          'Plant Name': depots.find(d => d['Plant Code'] === values.depot)?.Description,
          'Valution Type': product.valuationType,
          Item: index + 1,  // Increment Item number for each product
          'Material Code': product.code,
          'Material Name': product.name,
          'Order Qty': parseFloat(product.quantity),
          'Sls.UOM': product.uom,
          'Requested delivery date': values["Requested delivery date"].format('YYYY-MM-DD'),
          'Pat.Doc': values["Pat.Doc"] || '',
          order_type: values.order_type,
        };
  
        if (values["Order Type"] === 'ZCON') {
          return {
            ...baseOrderData,
            Customer: values.Customer.startsWith('CP') ? values.Customer : `CP${values.Customer}`,
            'Ship To Party': values.Customer.startsWith('CP') ? values.Customer : `CP${values.Customer}`,
            'Ship To Name': values["Customer Name"],
            'City(Ship To)': 'Casablanca',
            'Total Price': 0,
            'Unit Price': 0
          };
        } else {
          return {
            ...baseOrderData,
            'Ship To Party': values["Ship To Party"],
            'Ship To Name': values["Ship To Name"],
            'City(Ship To)': values["City(Ship To)"],
            'Unit Price': product.price,
            'Total Price': product.quantity * product.price
          };
        }
      });
  
      console.log('Orders to process:', JSON.stringify(ordersData, null, 2));
  
      const result = await createMultipleOrders(ordersData);
      
      console.log('API response:', JSON.stringify(result, null, 2));
  
      if (result.createdOrders && result.createdOrders.length > 0) {
        console.log(`${result.createdOrders.length} new order record(s) created under Sales Order ${salesOrderNumber}`);
        message.success(`${result.createdOrders.length} new order record(s) created successfully under Sales Order ${salesOrderNumber}`);
      }
      if (result.updatedOrders && result.updatedOrders.length > 0) {
        console.log(`${result.updatedOrders.length} order record(s) updated`);
        message.success(`${result.updatedOrders.length} order record(s) updated successfully`);
      }
      if (result.errors && result.errors.length > 0) {
        console.log(`${result.errors.length} order record(s) failed to process`);
        message.error(`${result.errors.length} order record(s) failed to process`);
      }
  
      onSave(result);
    } catch (error) {
      console.error('Error processing orders:', error);
      message.error('Failed to process orders. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card title={order ? (isReadOnly ? 'View Order' : 'Edit Order') : 'New Order'}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          order_type: 'VRAC',
          products: [{}]
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="depot" label="Dépôt source" rules={[{ required: true }]}>
              <AutoComplete
                placeholder="Select or type depot"
                disabled={isReadOnly}
                options={depots.map(depot => ({
                  value: depot['Plant Code'],
                  label: `${depot['Plant Code']} - ${depot.Description}`
                }))}
                filterOption={(inputValue, option) =>
                  option.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                }
                onSelect={handleDepotSelect}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="Order Type" label="Type de commande" rules={[{ required: true }]}>
              <Select 
                placeholder="Select order type" 
                disabled={isReadOnly}
                onChange={(value) => setOrderType(value)}
              >
                {['ZOR', 'ZCON', 'ZOC', 'SUR1'].map(type => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            {orderType === 'ZCON' ? (
              <Form.Item 
                name="Customer" 
                label="Dépôt destinataire"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="Select destination depot"
                  onChange={(value) => {
                    const selectedDepot = depots.find(depot => `CP${depot['Plant Code']}` === value);
                    if (selectedDepot) {
                      form.setFieldsValue({
                        'Customer Name': selectedDepot.Description,
                        'Ship To Party': value,
                        'Ship To Name': selectedDepot.Description,
                        'City(Ship To)': 'Casablanca'
                      });
                    }
                  }}
                  disabled={isReadOnly}
                  showSearch
                  optionFilterProp="children"
                >
                  {depots.map(depot => (
                    <Option key={depot['Plant Code']} value={`CP${depot['Plant Code']}`}>
                      CP{depot['Plant Code']} - {depot.Description}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            ) : (
              <Form.Item 
                name="Ship To Party"
                label="Code adresse de livraison Ship To"
                rules={[{ required: true }]}
              >
                <AutoComplete
                  placeholder="Select or type ship to address"
                  disabled={isReadOnly}
                  options={shipToOptions}
                  onSelect={handleShipToChange}
                  filterOption={(inputValue, option) =>
                    option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                  }
                />
              </Form.Item>
            )}
          </Col>
          <Col span={12}>
            <Form.Item 
              name="Customer Name" label={orderType === 'ZCON' ? "Nom du dépôt de facturation" : "Nom du client de facturation Sold To"}
              >
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
  
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="Requested delivery date" label="Date d'opération souhaité" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} disabled={isReadOnly} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="order_type" label="Order Type" rules={[{ required: true }]}>
                <Radio.Group onChange={handleOrderTypeChange} disabled={isReadOnly}>
                  <Radio value="PACK">PACK</Radio>
                  <Radio value="VRAC">VRAC</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
  
          {orderType !== 'ZCON' && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="Ship To Name" label="Nom du client de livraison Ship To">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="Customer" label="Référence client">
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>
  
              <Form.Item name="Statut de droit" label="Statut de droit">
                <Input disabled />
              </Form.Item>
  
              <Form.Item name="Customer ship to Address" label="Adresse de Livraison">
                <Input disabled />
              </Form.Item>
  
              <Form.Item name="City(Ship To)" label="Ville de livraison">
                <Input disabled />
              </Form.Item>
            </>
          )}
  
          <Form.List name="products">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Card 
                    key={field.key}
                    title={`Product ${index + 1}`} 
                    extra={!isReadOnly && fields.length > 1 && (
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    )}
                  >
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name={[field.name, 'code']}
                          label="Code produit"
                          rules={[{ required: true, message: 'Missing product code' }]}
                        >
                          <Select
                            placeholder="Select product code"
                            onChange={(value) => handleProductChange(index, 'code', value)}
                            disabled={isReadOnly}
                            showSearch
                            optionFilterProp="children"
                          >
                            {filteredProducts.map(product => (
                              <Option key={product.Material} value={product.Material}>
                                {product.Material} - {product['Material description']}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name={[field.name, 'name']}
                          label="Libellé produit"
                        >
                          <Input disabled />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          name={[field.name, 'valuationType']}
                          label="Valuation Type"
                          rules={[{ required: true, message: 'Missing valuation type' }]}
                        >
                          <Select placeholder="Select valuation type" disabled={isReadOnly}>
                            {['Dédouané', 'Sous-douane', 'Pêche', 'Saharien'].map(type => (
                              <Option key={type} value={type}>{type}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name={[field.name, 'quantity']}
                          label="Quantité"
                          rules={[{ required: true, message: 'Missing quantity' }]}
                        >
                          <Input 
                            type="number" 
                            disabled={isReadOnly}
                            onChange={(e) => handleQuantityChange(index, e.target.value)} 
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name={[field.name, 'uom']}
                          label="UOM"
                        >
                          <Input disabled />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                {!isReadOnly && (
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add Product
                    </Button>
                  </Form.Item>
                )}
              </>
            )}
          </Form.List>
  
          <Form.Item name="Pat.Doc" label="PAT.Doc">
            <Input disabled={isReadOnly} />
          </Form.Item>
  
          <Form.Item>
            <Button onClick={onCancel} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            {!isReadOnly && (
              <Button type="primary" htmlType="submit">
                {order ? 'Update Order' : 'Create Order'}
              </Button>
            )}
          </Form.Item>
        </Form>
      </Card>
    );
  };
  
  export default OrderForm;