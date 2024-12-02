import React, { useState } from 'react';
import { Button, message } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getTripById } from '../../services/api';
import vivoEnergyLogo from './vivo-energy-logo.png';
import shellLicenseeLogo from './shell-licensee.png';

const numberToWords = (number) => {
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  
    const convertLessThanOneThousand = (n) => {
      if (n === 0) return '';
  
      let result = '';
  
      if (n >= 100) {
        if (n >= 200) {
          result += units[Math.floor(n / 100)] + ' ';
        }
        result += 'cent ';
        n %= 100;
        if (n === 0 && result !== 'cent ') result = result.slice(0, -1);
      }
  
      if (n >= 20) {
        const tenIndex = Math.floor(n / 10);
        result += tens[tenIndex] + ' ';
        n %= 10;
        if (n === 1 && tenIndex !== 8) result += 'et ';
      }
  
      if (n >= 10 && n < 20) {
        result += teens[n - 10] + ' ';
        return result;
      }
  
      if (n > 0) result += units[n] + ' ';
  
      return result;
    };
  
    const convertNumber = (n) => {
      if (n === 0) return 'zéro';
  
      let result = '';
  
      if (n >= 1000000000) {
        result += convertLessThanOneThousand(Math.floor(n / 1000000000)) + 'milliard ';
        n %= 1000000000;
      }
  
      if (n >= 1000000) {
        result += convertLessThanOneThousand(Math.floor(n / 1000000)) + 'million ';
        n %= 1000000;
      }
  
      if (n >= 1000) {
        result += convertLessThanOneThousand(Math.floor(n / 1000)) + 'mille ';
        n %= 1000;
      }
  
      result += convertLessThanOneThousand(n);
  
      return result.trim();
    };
  
    const wholePart = Math.floor(number);
    const decimalPart = Math.round((number - wholePart) * 100);
  
    let result = convertNumber(wholePart) + ' dirham' + (wholePart !== 1 ? 's' : '');
  
    if (decimalPart > 0) {
      result += ' et ' + convertNumber(decimalPart) + ' centime' + (decimalPart !== 1 ? 's' : '');
    }
  
    return result;
  };

  const calculateInvoiceTotals = (orders) => {
    const totalBeforeTax = orders.reduce((sum, order) => sum + parseFloat(order['Total Price'] || 0), 0);
    const vatRate = orders[0]?.Product?.Tax || 0;
    const vatAmount = totalBeforeTax * vatRate;
    const totalWithTax = totalBeforeTax + vatAmount;
  
    return {
      totalBeforeTax,
      vatRate,
      vatAmount,
      totalWithTax
    };
  };
  
  const InvoicePDF = ({ trip }) => {
    const [loading, setLoading] = useState(false);
  
    const generatePDF = async () => {
      setLoading(true);
      try {
        const tripDetails = await getTripById(trip['Trip Num']);
  
        if (!tripDetails || !tripDetails.Orders || tripDetails.Orders.length === 0) {
          throw new Error('No orders found for this trip');
        }
  
        // Group orders by customer
        const ordersByCustomer = tripDetails.Orders.reduce((acc, order) => {
          const customerId = order.CustomerInfo['Customer Sold to'];
          if (!acc[customerId]) {
            acc[customerId] = [];
          }
          acc[customerId].push(order);
          return acc;
        }, {});
  
        const safeGet = (obj, path, defaultValue = '') => {
          return path.split('.').reduce((acc, part) => acc && acc[part], obj) || defaultValue;
        };
        
        const formatCurrency = (amount) => {
          return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
        };
  
        for (const [customerId, customerOrders] of Object.entries(ordersByCustomer)) {
          const firstOrder = customerOrders[0];
          const invoiceTotals = calculateInvoiceTotals(customerOrders);

        const invoiceHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Vivo Energy Invoice</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-size: 12px; /* Increased base font size */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                }
                .invoice {
                    width: 210mm; /* A4 width */
                    height: 297mm; /* A4 height */
                    margin: 0;
                    border: 1px solid #000;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                    margin-top: 20px;
                    padding: 5px;
                }
                .logo {
                    width: 150px;
                }
                .invoice-title {
                    font-size: 20px;
                    font-weight: bold;
                    text-align: center;
                    flex-grow: 1;
                }
                .invoice-number {
                    text-align: right;
                }
                .info-section {
                    display: flex;
                    justify-content: space-between;
                    padding: 0 5px;
                }
                .info-column {
                    width: 32%;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: none;
                    padding: 8px;
                    text-align: left;
                }
                .summary {
                    width: 50%;
                    margin-left: auto;
                    padding: 0 5px;
                }
                .summary table {
                    margin-bottom: 10px;
                }
                .summary td {
                    text-align: center;
                }
                .summary td:first-child {
                    text-align: left;
                }
                .summary td:last-child {
                    text-align: right;
                }
                .total {
                    font-weight: bold;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 10px;
                    display: flex;
                    justify-content: space-between;
                    border-top: 1px solid #ccc;
                    padding: 10px 5px 5px;
                }
                .footer-text {
                    width: 80%;
                    line-height: 1.2;
                }
                .footer-text p {
                    margin: 0;
                }
                .footer-logo {
                    width: 150px;
                    height: 100px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .signatures {
                    justify-content: right;
                    width: 40%;
                    margin-top: 20px;
                    margin-bottom: 100px;
                    padding: 0 5px;
                }
                .invoice-summary {
                    border-top: 1px solid #000;
                    border-bottom: 1px solid #000;
                    padding: 10px 5px;
                    margin: 20px 0;
                    display: flex;
                    justify-content: space-between;
                }
                .empty-block {
                    border-top: 1px solid #000;
                    border-bottom: 1px solid #000;
                    height: 200px;
                    margin: 0;
                }
                .flex-grow {
                    flex-grow: 1;
                    min-height: 20px;
                }
            </style>
        </head>
          <body>
              <div class="invoice">
                  <div class="header">
                      <img src="${vivoEnergyLogo}" alt="Vivo Energy Logo" class="logo">
                      <div class="invoice-title">Facture</div>
                      <div class="invoice-number">Page 1 / 1</div>
                  </div>
                  
                  <div class="info-section">
                      <div class="info-column">
                          <p><strong>Facture à:</strong> ${safeGet(firstOrder, 'CustomerInfo.Customer Sold to')}</p>
                          <p>${safeGet(firstOrder, 'CustomerInfo.Customer Sold to name')}</p>
                          <p>${safeGet(firstOrder, 'CustomerInfo.Customer ship to Address')}</p>
                          <p>${safeGet(firstOrder, 'CustomerInfo.Customer ship to city')}</p>
                          <p>${safeGet(firstOrder, 'CustomerInfo.Country', 'Morocco')}</p>
                      </div>
                      <div class="info-column">
                          <p><strong>Livré à:</strong> ${safeGet(firstOrder, 'ShipToInfo.Customer Ship to')}</p>
                          <p>${safeGet(firstOrder, 'ShipToInfo.Customer ship to name')}</p>
                          <p>${safeGet(firstOrder, 'ShipToInfo.Customer ship to Address')}</p>
                          <p>${safeGet(firstOrder, 'ShipToInfo.Customer ship to city')}</p>
                          <p>${safeGet(firstOrder, 'ShipToInfo.Country', 'Morocco')}</p>
                      </div>
                      <div class="info-column">
                          <p><strong>Numéro de facture:</strong> ${tripDetails.numfacture}</p>
                          <p><strong>Date de facturation:</strong> ${new Date().toLocaleDateString()}</p>
                          <p><strong>Devise:</strong> MAD</p>
                          <p><strong>Dépôt de Chargement:</strong> ${safeGet(firstOrder, 'PlantInfo.Plant Code')}</p>
                      </div>
                  </div>

                  <div class="info-section">
                      <div class="info-column">
                          <p><strong>Identifiant Fiscal:</strong> ${safeGet(firstOrder, 'CustomerInfo.ID Fiscal')}</p>
                          <p><strong>ICE (Client):</strong> ${safeGet(firstOrder, 'CustomerInfo.ICE')}</p>
                      </div>
                  </div>

                  <div class="info-section">
                      <div class="info-column">
                          <p><strong>Numéro BL:</strong> ${safeGet(firstOrder, 'Pat.Doc')}</p>
                          <p><strong>Numéro de commande:</strong> ${safeGet(firstOrder, 'Sales Order')}</p>
                      </div>
                      <div class="info-column">
                          <p><strong>Date de livraison:</strong> ${safeGet(tripDetails, 'Tour Start Date')}</p>
                          <p><strong>Votre référence:</strong> ${safeGet(firstOrder, 'Votre référence')}</p>
                      </div>
                      <div class="info-column">
                          <p><strong>Livré à:</strong> ${safeGet(firstOrder, 'ShipToInfo.Customer ship to name')}</p>
                      </div>
                  </div>

                  <table>
                      <tr>
                          <th>Code produit</th>
                          <th>Description</th>
                          <th>Regime</th>
                          <th>Quantité</th>
                          <th>Unité de mesure</th>
                          <th>Statut de Droit</th>
                          <th>Prix unitaire</th>
                          <th>Montant Net</th>
                      </tr>
                      ${customerOrders.map(order => `
                          <tr>
                              <td>${safeGet(order, 'Product.Material')}</td>
                              <td>${safeGet(order, 'Product.Material description')}</td>
                              <td>${safeGet(order, 'Valution Type')}</td>
                              <td>${safeGet(order, 'Order Qty')}</td>
                              <td>${safeGet(order, 'Product.Base Unit of Measure')}</td>
                              <td>${safeGet(order, 'CustomerInfo.Statut de droit')}</td>
                              <td>${formatCurrency(order['Total Price'] / order['Order Qty'])}</td>
                              <td>${formatCurrency(order['Total Price'])}</td>
                          </tr>
                      `).join('')}
                  </table>

                  <div class="invoice-summary">
                      <div><strong>Résumé de la facture</strong></div>
                      <div><strong>Date début livraison:</strong> ${safeGet(tripDetails, 'Tour Start Date')}</div>
                      <div><strong>Date fin livraison:</strong> ${safeGet(tripDetails, 'Tour Start Date')}</div>
                  </div>

                  <div class="summary">
                      <table>
                          <tr>
                              <td>Montant hors Taxe</td>
                              <td></td>
                              <td>${formatCurrency(invoiceTotals.totalBeforeTax)}</td>
                          </tr>
                          <tr>
                              <td>TVA</td>
                              <td style="text-align: center;">${invoiceTotals.vatRate*100}% 109: ${invoiceTotals.vatRate*100}% AR VAT On Fuels</td>
                              <td>${formatCurrency(invoiceTotals.vatAmount)}</td>
                          </tr>
                          <tr class="total">
                              <td>Montant TTC</td>
                              <td></td>
                              <td>${formatCurrency(invoiceTotals.totalWithTax)}</td>
                          </tr>
                      </table>
                      <p>${numberToWords(invoiceTotals.totalWithTax).toUpperCase()}</p>
                  </div>

                  <div class="empty-block"></div>

                  <div class="flex-grow"></div>

                  <div class="info-section">
                      <div class="info-column">
                          <p><strong>Délai de paiement:</strong> ${safeGet(firstOrder, 'CustomerInfo.Paiement terms')}</p>
                      </div>
                      <div class="info-column">
                          <p><strong>Échéance de la facture:</strong> ${new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString()}</p>
                      </div>
                      <div class="info-column">
                          <p><strong>Type de facturation:</strong> ${safeGet(firstOrder, 'CustomerInfo.Paiement terms')}</p>
                      </div>
                  </div>

                  <p style="padding: 0 5px;"><strong>Moyen de paiement:</strong></p>

                  <div class="signatures">
                      <div>
                          <p>Signature Vivo Energy Maroc:</p>
                      </div>
                      <div>
                          <p>Signature Client:</p>
                      </div>
                  </div>

                  <div style="clear: both;"></div>

                  <div class="footer">
                      <div class="footer-text">
                          <p>VIVO ENERGY MAROC - S.A au Capital de 248 400 000 DH - R.C.: 463 - C.N.S.S: 1929134 - Patente N°: 36100921- I.F N°: 01 0000 02 - T.V.A N°: 305230 -I.C.E : 000230893000079</p>
                          <p>Immeuble le Zénith II, Lotissement Attaoufik, Route de Nouacer, Sidi Maârouf - B.P. 13026 / Casablanca - Maroc</p>
                          <p>Tel : +212 522 97 27 77 - Fax : +212522 97 77</p>
                          <p>Les marques commerciales de Shell sont utilisées sous licence.</p>
                          <p>*En vertu de l'article 78-3 de la loi 32-10, et en cas de non-respect du délai de paiement, qu'il soit réglementaire ou conventionnel, des pénalités de retard sont exigibles le jour suivant la date limite de paiement, le taux de la pénalité de retard à appliquer est égal au taux directeur de Bank Al Maghrib augmenté d'un taux de marge 7% *</p>
                      </div>
                      <div class="footer-logo">
                          <img src="${shellLicenseeLogo}" alt="Shell Licensee Logo" style="width: 100px;">
                      </div>
                  </div>
              </div>
          </body>
          </html>
        `;

        const element = document.createElement('div');
        element.innerHTML = invoiceHTML;
        document.body.appendChild(element);

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false
        });

        document.body.removeChild(element);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`invoice_${tripDetails['Trip Num']}_${customerId}.pdf`);
      }

      message.success('Invoices generated successfully');
    } catch (error) {
      console.error('Error generating invoices:', error);
      message.error('Failed to generate invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      icon={<FilePdfOutlined />}
      onClick={generatePDF}
      loading={loading}
    >
      Generate Invoices
    </Button>
  );
};

export default InvoicePDF;