import React, { useState } from 'react';
import { Button, message, Modal } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getTripById } from '../../services/api';
import vivoLogo from './vivo-energy-logo.png';

const LoadingSlipPDF = ({ tripId }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  const fetchTripData = async (tripId) => {
    try {
      const tripData = await getTripById(tripId);
      if (!tripData) {
        throw new Error('No trip data received');
      }
      console.log('Fetched trip data:', JSON.stringify(tripData, null, 2));
      return tripData;
    } catch (error) {
      console.error('Error fetching trip data:', error);
      throw error;
    }
  };

  const processOrderData = (trip) => {
    const uniqueOrders = trip.Orders || [];
    const totalOrders = trip.Orders || [];

    const productTotals = totalOrders.reduce((acc, order) => {
      const key = order.Product.Material;
      if (!acc[key]) {
        acc[key] = {
          codeProduit: order.Product.Material,
          description: order.Product['Material description'],
          regime: order['Valution Type'],
          qteACharger: 0,
          um: order.Product['Base Unit of Measure']
        };
      }
      acc[key].qteACharger += parseFloat(order['Order Qty']);
      return acc;
    }, {});

    return { uniqueOrders, totalOrders, productTotals };
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    message.loading('Generating Loading Slip...', 0);

    try {
      const tripData = await fetchTripData(tripId);
      const { uniqueOrders, totalOrders, productTotals } = processOrderData(tripData);

      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString();
      const formattedTime = currentDate.toLocaleTimeString();

      const firstOrder = totalOrders[0];
      const truck = tripData.Truck;

      const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bon de chargement – Produits emballes</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  font-size: 9px;
                  margin: 0;
                  padding: 15mm;
                  height: 297; /* 297mm - 30mm (top and bottom padding) */
                  width: 210mm; /* 210mm - 30mm (left and right padding) */
                  box-sizing: border-box;
                  flex-grow: 1;
              }
              .content-frame {
                  border: 1px solid black;
                  height: 250mm;
                  display: flex;
                  flex-direction: column;
                  padding: 10px;
              }
              .header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 10px;
              }
              .logo {
                  width: 130px;
                  height: 70px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
              }
              .logo img {
                  max-width: 100%;
                  max-height: 100%;
                  object-fit: contain;
              }
              .title {
                  font-size: 18px;
                  font-weight: bold;
              }
              .page-number {
                  font-size: 10px;
              }
              .divider {
                  border-top: 1px solid black;
                  margin: 10px 0;
              }
              .middle-content {
                  flex-grow: 1;
                  display: flex;
                  flex-direction: column;
              }
              .info-columns {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 10px;
              }
              .info-column {
                  width: 32%;
              }
              .info-item {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 5px;
              }
              .order-table {
                  width: 66%;
                  border-collapse: collapse;
                  font-size: 9px;
                  margin-top: -20px;
                  margin-bottom: 90px;
              }
              .order-table th, .order-table td {
                  border: 1px solid black;
                  padding: 3px;
                  text-align: left;
              }
              .main-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 10px;
              }
              .main-table th, .main-table td {
                  border: 1px solid black;
                  padding: 3px;
                  text-align: left;
              }
              .centered-table {
                  width: 70%;
                  margin: 10px auto;
                  border-collapse: collapse;
              }
              .centered-table th, .centered-table td {
                  border: 1px solid black;
                  padding: 3px;
              }
              .bottom-content {
                  margin-top: auto;
              }
              .signatures {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  margin-bottom: 10px;
              }
              .signature-column {
                  width: 30%;
              }
              .totals {
                  display: flex;
                  flex-direction: column;
              }
              .total-item {
                  margin-bottom: 5px;
              }
              .signature-line {
                  margin-top: 30px;
                  border-top: 1px solid black;
                  width: 100%;
              }
              .footer {
                  font-size: 8px;
                  margin-top: 10px;
              }
              .total-par-produit {
                  font-weight: bold;
                  text-align: left;
                  margin-top: 30px;
                  margin-left: 100px;
                  margin-bottom: 1px;
              }
              .total-par-produit-title {
                  font-weight: bold;
                  text-align: left;
                  margin-bottom: 5px;
              }
          </style>
      </head>
      <body>
          <div class="content-frame">
              <div class="header">
                  <div class="logo">
                      <img src="${vivoLogo}" alt="VIVO ENERGY LOGO">
                  </div>
                  <div class="title">Bon de chargement – Produits emballes</div>
                  <div class="page-number">Page 1 / 1</div>
              </div>

              <div class="divider"></div>

              <div class="middle-content">
                  <div class="info-columns">
                      <div class="info-column">
                          <div class="info-item"><span>Immatriculation N°</span><span>${truck?.Vehicle || 'N/A'}</span></div>
                          <div class="info-item"><span>Remorque N°</span><span>${truck?.['Trailer Number'] || 'N/A'}</span></div>
                          <div class="info-item"><span>Tournée N°</span><span>${tripData['Trip Num'] || 'N/A'}</span></div>
                          <div class="info-item"><span>Nom du transporteur</span><span>${truck?.['Haulier name'] || 'N/A'}</span></div>
                          <div class="info-item"><span>Capacité :</span><span>${truck?.['Vehicule Capacity'] || 'N/A'} KG</span></div>
                      </div>
                      <div class="info-column">
                          <div class="info-item"><span>Id chauffeur :</span><span>${tripData['Driver CIN'] || 'N/A'}</span></div>
                          <div class="info-item"><span>Chauffeur :</span><span>${tripData['Driver Name'] || 'N/A'}</span></div>
                      </div>
                      <div class="info-column">
                          <div class="info-item"><span>Date d'impression:</span><span>${formattedDate}</span></div>
                          <div class="info-item"><span>Heure d'impression</span><span>${formattedTime}</span></div>
                          <div class="info-item"><span>Créé par</span><span>999999</span></div>
                          <div class="info-item"><span>Heure de chargement</span><span></span></div>
                            <div class="info-item"><span>PAT N°</span><span>${firstOrder?.['Pat.Doc'] || 'N/A'}</span></div>
                            <div class="info-item"><span>Depot</span><span>${firstOrder?.PlantInfo?.['Plant Code'] || 'N/A'}</span></div>
                            <div class="info-item"><span>Nom Depot</span><span>${firstOrder?.PlantInfo?.Description || 'N/A'}</span></div>
                      </div>
                  </div>

                  <table class="order-table">
                      <tr>
                          <th>Commande N°</th>
                          <th>Destinataire</th>
                          <th>Ville</th>
                      </tr>
                      ${uniqueOrders.map(order => `
                          <tr>
                              <td>${order['Sales Order'] || 'N/A'}</td>
                              <td>${order.ShipToInfo?.['Customer Ship to'] || 'N/A'}</td>
                              <td>${order.ShipToInfo?.['Customer ship to city'] || 'N/A'}</td>
                          </tr>
                      `).join('')}
                  </table>

                  <table class="main-table">
                      <tr>
                          <th>Code Produit</th>
                          <th>Description</th>
                          <th>Régime</th>
                          <th>Quantité totale</th>
                          <th>Qté - LOB</th>
                          <th>Qté à charger</th>
                          <th>UM</th>
                          <th>Situation droits</th>
                          <th>N° lot</th>
                          <th>Warehouse</th>
                      </tr>
                      ${totalOrders.map(order => `
                          <tr>
                              <td>${order['Material Code'] || 'N/A'}</td>
                              <td>${order['Material Name'] || 'N/A'}</td>
                              <td>${order['Valution Type'] || 'N/A'}</td>
                              <td>${order['Order Qty'] || 'N/A'}</td>
                              <td></td>
                              <td>${order['Order Qty'] || 'N/A'}</td>
                              <td>${order.Product?.['Base Unit of Measure'] || order['Sls.UOM'] || 'N/A'}</td>
                              <td>${order.CustomerInfo?.['Statut de droit name'] || 'N/A'}</td>
                              <td>${order['Valution Type'] || 'N/A'}</td>
                              <td></td>
                          </tr>
                      `).join('')}
                  </table>

                  <div class="total-par-produit">Total par Produit</div>
                  <table class="centered-table">
                      <tr>
                          <th>Code Produit</th>
                          <th>Description</th>
                          <th>Régime</th>
                          <th>Qté à charger</th>
                          <th>UM</th>
                      </tr>
                      ${Object.values(productTotals).map(product => `
                          <tr>
                              <td>${product.codeProduit || 'N/A'}</td>
                              <td>${product.description || 'N/A'}</td>
                              <td>${product.regime || 'N/A'}</td>
                              <td>${product.qteACharger.toFixed(2)}</td>
                              <td>${product.um || 'N/A'}</td>
                          </tr>
                      `).join('')}
                  </table>
              </div>

              <div class="bottom-content">
                  <div class="total-par-produit-title">Total par Produit</div>
                  <div class="signatures">
                      <div class="signature-column">
                          <div class="totals">
                              <div class="total-item">
                                  <div>Poids total</div>
                                  <div>${truck?.['Vehicule Capacity'] || 'N/A'} KG</div>
                              </div>
                              <div class="total-item">
                                  <div>Quantité totale</div>
                                  <div>${tripData['Order Qty'] || 'N/A'} ${firstOrder?.['Valution Type'] || 'N/A'}</div>
                              </div>
                          </div>
                      </div>
                      <div class="signature-column">
                          <div>Signature de Vivo Energy</div>
                          <div class="signature-line"></div>
                      </div>
                      <div class="signature-column">
                          <div>Signature du chauffeur</div>
                          <div class="signature-line"></div>
                      </div>
                  </div>

                  <div class="divider"></div>

                  <div class="footer">
                      VIVO ENERGY MAROC - S.A au Capital de 248 400 000 DH - R.C.: 463 - C.N.S.S: 1929134 - Patente N°: 36100921- I.F N°: 01 000 102 - T.V.A N°: 805329 - I.C.E. :<br>
                      000230893000079<br>
                      Immeuble le Zenith II, Lotissement Attaoufik, Route de Nouacer, Sidi Maârouf, B.P. 13026 / Casablanca - Maroc<br>
                      Tél.: +212 522 317 777 - Fax.: +212 522 317 77. ( www.vivoenergy.com)<br>
                      Les marques commerciales de Shell sont utilisées sous licence.<br>
                      *En vertu de l'article 78-3 de la loi 32-10, et en cas de non-respect du délai de paiement, qu'il soit réglementaire ou conventionnel, des pénalités de retard sont exigibles<br>
                      le jour suivant la date limite de paiement, le taux de la pénalité de retard à appliquer est égal au taux directeur de la Bank Al Maghrib augmenté d'un taux de marge 7% =
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;

    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    document.body.appendChild(element);

    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      imageTimeout: 15000
    });

    document.body.removeChild(element);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`loading_slip_${tripId}.pdf`);

    message.success('Loading Slip generated successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    message.error(`Failed to generate Loading Slip: ${error.message}`);
    setDebugInfo({
      error: error.message,
      errorDetails: error.response?.data,
      errorStack: error.stack
    });
  } finally {
    setIsGenerating(false);
    message.destroy();
  }
};

  const showDebugModal = () => {
    Modal.info({
      title: 'Debug Information',
      width: 800,
      content: (
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      ),
    });
  };

  return (
    <>
      <Button
        icon={<FilePdfOutlined />}
        onClick={generatePDF}
        loading={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Loading Slip'}
      </Button>
      {debugInfo && (
        <Button onClick={showDebugModal} style={{ marginLeft: 8 }}>
          Show Debug Info
        </Button>
      )}
    </>
  );
};

export default LoadingSlipPDF;