import React, { useState } from 'react';
import { Card, Badge, ListGroup, Button, Collapse, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle, faInfoCircle, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import '../../styles/ValidationResults.css';

const ValidationResults = ({ results }) => {
  const [showErrors, setShowErrors] = useState(false);
  const [showSuccesses, setShowSuccesses] = useState(false);

  if (!results) return null;

  const { importType, status, recordsImported, details } = results;
  const errors = details?.errors || [];
  const successes = details?.successes || [];

  const getStatusVariant = (status) => {
    if (typeof status !== 'string') {
      return 'info'; // Default variant if status is not a string
    }
    
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'completed with errors':
        return 'warning';
      case 'failed':
        return 'danger';
      default:
        return 'info';
    }
  };

  const renderListItem = (label, value, variant = "info") => (
    <ListGroup.Item className="d-flex justify-content-between align-items-center">
      {label}
      <Badge variant={variant} pill>{value}</Badge>
    </ListGroup.Item>
  );

  const statusVariant = getStatusVariant(status);

  return (
    <Card className="validation-results">
      <Card.Header as="h5" className={`bg-${statusVariant} text-white`}>
        <FontAwesomeIcon icon={status === 'Completed' ? faCheckCircle : faExclamationTriangle} className="mr-2" />
        Résultats de l'Importation
      </Card.Header>
      <Card.Body>
        <ListGroup variant="flush">
          {renderListItem("Type d'importation", importType || 'N/A', "primary")}
          {renderListItem("Statut", status || 'N/A', statusVariant)}
          {renderListItem("Enregistrements Importés", recordsImported || 0, "success")}
        </ListGroup>

        {details?.missingProducts?.length > 0 && (
          <div className="mt-3">
            <h6>Produits manquants:</h6>
            <Badge variant="warning" className="mr-1">{details.missingProducts.length}</Badge>
            <OverlayTrigger
              placement="right"
              overlay={<Tooltip id="missing-products-tooltip">{details.missingProducts.join(', ')}</Tooltip>}
            >
              <FontAwesomeIcon icon={faInfoCircle} className="text-info" />
            </OverlayTrigger>
          </div>
        )}

        {details?.missingClients?.length > 0 && (
          <div className="mt-2">
            <h6>Clients manquants:</h6>
            <Badge variant="warning" className="mr-1">{details.missingClients.length}</Badge>
            <OverlayTrigger
              placement="right"
              overlay={<Tooltip id="missing-clients-tooltip">{details.missingClients.join(', ')}</Tooltip>}
            >
              <FontAwesomeIcon icon={faInfoCircle} className="text-info" />
            </OverlayTrigger>
          </div>
        )}

        {errors.length > 0 && (
          <div className="mt-4">
            <Button
              onClick={() => setShowErrors(!showErrors)}
              aria-controls="error-collapse"
              aria-expanded={showErrors}
              variant="outline-danger"
              className="d-flex justify-content-between align-items-center w-100"
            >
              <span>Afficher les erreurs ({errors.length})</span>
              <FontAwesomeIcon icon={showErrors ? faChevronUp : faChevronDown} />
            </Button>
            <Collapse in={showErrors}>
              <div id="error-collapse" className="mt-2">
                <ListGroup variant="flush">
                  {errors.map((error, index) => (
                    <ListGroup.Item key={index} className="text-danger">
                      <strong>Erreur:</strong> {error.error}
                      <br />
                      <strong>Données:</strong> 
                      <pre className="mt-2 bg-light p-2 rounded">
                        {JSON.stringify(error.data, null, 2)}
                      </pre>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            </Collapse>
          </div>
        )}

        {successes.length > 0 && (
          <div className="mt-4">
            <Button
              onClick={() => setShowSuccesses(!showSuccesses)}
              aria-controls="success-collapse"
              aria-expanded={showSuccesses}
              variant="outline-success"
              className="d-flex justify-content-between align-items-center w-100"
            >
              <span>Afficher les succès ({successes.length})</span>
              <FontAwesomeIcon icon={showSuccesses ? faChevronUp : faChevronDown} />
            </Button>
            <Collapse in={showSuccesses}>
              <div id="success-collapse" className="mt-2">
                <ListGroup variant="flush">
                  {successes.map((success, index) => (
                    <ListGroup.Item key={index} className="text-success">
                      <strong>ID:</strong> {success.id}
                      <br />
                      <strong>Message:</strong> {success.message}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            </Collapse>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ValidationResults;