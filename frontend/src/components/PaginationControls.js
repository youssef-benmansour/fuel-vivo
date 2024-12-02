import React from 'react';
import { Form, Pagination } from 'react-bootstrap';

const PaginationControls = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange }) => {
  // Ensure totalPages is a valid number and at least 1
  const validTotalPages = Math.max(1, Number.isFinite(totalPages) ? totalPages : 1);

  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <Form.Group>
        <Form.Label>Lignes par page:</Form.Label>
        <Form.Control as="select" value={itemsPerPage} onChange={onItemsPerPageChange}>
          {[10, 25, 50].map(value => (
            <option key={value} value={value}>{value}</option>
          ))}
        </Form.Control>
      </Form.Group>
      <Pagination>
        <Pagination.First onClick={() => onPageChange(1)} disabled={currentPage === 1} />
        <Pagination.Prev onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} />
        {[...Array(validTotalPages).keys()].map(number => (
          <Pagination.Item
            key={number + 1}
            active={number + 1 === currentPage}
            onClick={() => onPageChange(number + 1)}
          >
            {number + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === validTotalPages} />
        <Pagination.Last onClick={() => onPageChange(validTotalPages)} disabled={currentPage === validTotalPages} />
      </Pagination>
    </div>
  );
};

export default PaginationControls;