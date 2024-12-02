import React, { useState } from 'react';
import { Button, message } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getTripById } from '../../services/api';
import vivoEnergyLogo from './vivo-energy-logo.png';
import shellLicenseeLogo from './shell-licensee.png';

const DeliveryNotePDF = ({ trip }) => {
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

      for (const [customerId, customerOrders] of Object.entries(ordersByCustomer)) {
        const firstOrder = customerOrders[0];

      const deliveryNoteHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bon de livraison vrac</title>
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
    .container {
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
        align-items: center;
        margin-bottom: 2mm;
        padding: 2mm;
    }
    .logo {
        width: 240px;
    }
    .title {
        font-size: 26px; /* Increased title font size */
        font-weight: bold;
    }
    .page-info {
        text-align: right;
        font-size: 14px; /* Increased page info font size */
    }
    .info-columns {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5mm;
        padding: 0 5mm;
        font-size: 14px; /* Increased info columns font size */
    }
    .info-column {
        width: 30%;
        line-height: 1.6;
    }
    .client-info {
        margin-bottom: 5mm;
        padding: 0 5mm;
        margin-top: -15mm;
        font-size: 14px; /* Increased client info font size */
    }
    .client-info-row {
        margin-bottom: 2mm;
    }
    .client-info-columns {
        display: flex;
    }
    .client-info-column {
        width: 33%;
    }
    .seale-info {
        margin-top: 6mm;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 5mm;
        font-size: 14px; /* Increased table font size */
    }
    th, td {
        border: 1px solid #000;
        padding: 1mm;
        text-align: left;
        border-left: none;
        border-right: none;
    }
    .footer-columns {
        display: flex;
        justify-content: space-between;
        border-top: 1px solid #000;
        border-bottom: 1px solid #000;
        padding: 2mm 5mm;
        margin-top: auto;
        font-size: 12px; /* Increased footer columns font size */
    }
    .footer-column {
        width: 24%;
        line-height: 1.8;
    }
    .signature-line {
        border-top: 1px solid #000;
        margin-top: 10mm;
    }
    .flex-grow {
        flex-grow: 1;
    }
    .small-text {
        font-size: 10px;
        padding: 2mm 5mm;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
    }
    .footer-logo {
        width: 140px;
        height: 60px;
    }
</style>
        </head>
<body>
              <div class="container">
                  <div class="header">
                      <img src="${vivoEnergyLogo}" alt="Vivo Energy Logo" class="logo">
                      <div class="title">Bon de livraison vrac</div>
                      <div class="page-info">
                          Page 1/1<br>
                          CLIENT
                      </div>
                  </div>

                  <div class="info-columns">
                      <div class="info-column">
                          <strong>Numéro Client:</strong> ${safeGet(firstOrder, 'CustomerInfo.Customer Sold to')}<br>
                          ${safeGet(firstOrder, 'CustomerInfo.Customer Sold to name')}<br>
                          ${safeGet(firstOrder, 'CustomerInfo.Customer ship to Address')}<br>
                          ${safeGet(firstOrder, 'CustomerInfo.Customer ship to city')}<br>
                          ${safeGet(firstOrder, 'CustomerInfo.Country', 'Morocco')}
                      </div>
                      <div class="info-column">
                          <strong>Livré à:</strong> ${safeGet(firstOrder, 'ShipToInfo.Customer Ship to')}<br>
                          ${safeGet(firstOrder, 'ShipToInfo.Customer ship to name')}<br>
                          ${safeGet(firstOrder, 'ShipToInfo.Customer ship to Address')}<br>
                          ${safeGet(firstOrder, 'ShipToInfo.Customer ship to city')}<br>
                          ${safeGet(firstOrder, 'ShipToInfo.Country', 'Morocco')}
                      </div>
                      <div class="info-column">
                          <strong>Livraison N°:</strong> ${tripDetails.numlivraison}<br>
                          <strong>Date:</strong> ${new Date(tripDetails['Tour Start Date']).toLocaleDateString()}<br>
                          <strong>Code dépôt:</strong> ${safeGet(firstOrder, 'PlantInfo.Plant Code')}<br>
                          <strong>Depot:</strong> ${safeGet(firstOrder, 'PlantInfo.Description')}<br>
                          <strong>PAT N°:</strong> ${safeGet(firstOrder, 'Pat.Doc')}<br>
                          <strong>Créé par:</strong> ${safeGet(tripDetails, 'createdBy')}<br>
                          <strong>Heure d'impression:</strong> ${new Date().toLocaleTimeString()}<br>
                          <strong>Tournée N°:</strong> ${tripDetails['Trip Num']}<br>
                          <strong>Numéro de tournée manuelle:</strong>
                      </div>
                  </div>

                  <div class="client-info">
                      <div class="client-info-row">
                          <strong>Identifiant Fiscal:</strong> ${safeGet(firstOrder, 'CustomerInfo.ID Fiscal')}
                      </div>
                      <div class="client-info-row">
                          <strong>ICE Client:</strong> ${safeGet(firstOrder, 'CustomerInfo.ICE')}
                      </div>
                      <div class="client-info-columns">
                          <div class="client-info-column">
                              <strong>Commande N°:</strong> ${safeGet(firstOrder, 'Sales Order')}
                          </div>
                          <div class="client-info-column">
                              <strong>Référence client:</strong> ${safeGet(firstOrder, 'Reference')}
                          </div>
                      </div>
                      <div class="seale-info">
                          <strong>Scellé N°:</strong> ${tripDetails.sealnumbers.join(', ')}
                      </div>
                  </div>

                  <table>
                      <thead>
                          <tr>
                              <th>Code produit</th>
                              <th>Description</th>
                              <th>Régime</th>
                              <th>Densité à15°C</th>
                              <th>Quantité UM</th>
                              <th>Observation</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${customerOrders.map(order => `
                              <tr>
                                  <td>${safeGet(order, 'Product.Material')}</td>
                                  <td>${safeGet(order, 'Product.Material description')}</td>
                                  <td>${safeGet(order, 'Valution Type')}</td>
                                  <td>${safeGet(order, 'Product.density')}</td>
                                  <td>${safeGet(order, 'Order Qty')} ${safeGet(order, 'Product.Base Unit of Measure')}</td>
                                  <td></td>
                              </tr>
                          `).join('')}
                          <tr>
                              <td>Total</td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td>${customerOrders.reduce((sum, order) => sum + parseFloat(order['Order Qty']), 0)} ${safeGet(firstOrder, 'Product.Base Unit of Measure')}</td>
                              <td></td>
                          </tr>
                      </tbody>
                  </table>

                  <div class="flex-grow"></div>

                  <div class="footer-columns">
                      <div class="footer-column">
                          <strong>Camion N°:</strong> ${safeGet(tripDetails, 'Truck.Vehicle')}<br>
                          <strong>Remorque N°:</strong> ${safeGet(tripDetails, 'Truck.Trailer Number')}<br>
                          <strong>Transporteur:</strong> ${safeGet(tripDetails, 'Truck.Haulier name')}
                      </div>
                      <div class="footer-column">
                          <strong>Chauffeur N°:</strong> ${tripDetails['Driver CIN']}<br>
                          <br>
                          <strong>Nom du chauffeur:</strong> ${tripDetails['Driver Name']}
                      </div>
                      <div class="footer-column">
                          <strong>Signature du chauffeur</strong>
                          <div class="signature-line"></div>
                      </div>
                      <div class="footer-column">
                          <strong>Nom et signature du client</strong>
                          <div class="signature-line"></div>
                      </div>
                  </div>

                  <div class="small-text">
                      <div>
                          VIVO ENERGY MAROC - S.A au Capital de 248 400 000 DH - R.C.: 463 - C.N.S.S: 1929134 - Patente N°: 36100921- I.F N°: 01 000 02 - T.V.A N°: 805329 - I.C.E : 000230893000079<br>
                          Immeuble le Zenith II, Lotissement Attaoufik, Route de Nouacer, Sidi Maârouf - B.P. 13026 / Casablanca - Maroc<br>
                          Tél.: +212 522 97 27 27 - Fax.: +212 522 97 27 77 - www.vivoenergy.com<br>
                          Les marques commerciales de Shell sont commercialisées sous licence.<br>
                          *En vertu de l'article 78-3 de la loi 32-10, et en cas de non-respect du délai de paiement, qu'il soit réglementaire ou conventionnel, des pénalités de retard sont exigibles<br>
                          le jour suivant la date limite de paiement, le taux de la pénalité de retard à appliquer est égal au taux directeur de la Bank Al Maghrib augmenté d'un taux de marge 7% =
                      </div>
                      <img src="${shellLicenseeLogo}" alt="Shell Licensee Logo" class="footer-logo">
                  </div>
              </div>
          </body>
          </html>
        `;

        const element = document.createElement('div');
        element.innerHTML = deliveryNoteHTML;
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
        pdf.save(`delivery_note_${tripDetails['Trip Num']}_${customerId}.pdf`);
      }

      message.success('Delivery notes generated successfully');
    } catch (error) {
      console.error('Error generating delivery notes:', error);
      message.error('Failed to generate delivery notes. Please try again.');
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
      Generate Delivery Notes
    </Button>
  );
};

export default DeliveryNotePDF;