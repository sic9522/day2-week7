import { Modal } from 'react-bootstrap'

function StartChatModal({ show, name, onConfirm, onClose }) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Body>
        <p className="mb-3">
          Vuoi avviare una nuova chat con <strong>{name}</strong>?
        </p>
        <div className="modal-confirm-actions">
          <button type="button" className="auth-submit" onClick={onConfirm}>Sì</button>
          <button type="button" className="modal-cancel-btn" onClick={onClose}>No</button>
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default StartChatModal
