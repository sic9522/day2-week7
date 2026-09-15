import { Modal } from 'react-bootstrap'

function DeleteChatModal({ show, name, onConfirm, onClose }) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Body>
        <p className="mb-3">
          Eliminare la chat con <strong>{name}</strong>? Verrà rimossa anche per l'altra persona e non potrà essere recuperata.
        </p>
        <div className="modal-confirm-actions">
          <button type="button" className="modal-danger-btn" onClick={onConfirm}>Elimina</button>
          <button type="button" className="modal-cancel-btn" onClick={onClose}>Annulla</button>
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default DeleteChatModal
