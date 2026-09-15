import { useState } from 'react'
import { Form, Modal } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useChats } from '../context/ChatsContext'

function NewChatModal({ show, onClose }) {
  const { startChat } = useChats()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  function handleClose() {
    setUsername('')
    setError('')
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const chatId = await startChat(username)
      handleClose()
      navigate(`/chat/${chatId}`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="mb-0">Con chi vuoi iniziare una chat?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-1">
            <Form.Label>Username</Form.Label>
            <Form.Control
              autoFocus
              value={username}
              isInvalid={!!error}
              onChange={(e) => {
                setUsername(e.target.value)
                setError('')
              }}
              placeholder="es. giulia.rossi"
            />
            <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
          </Form.Group>
          <button type="submit" className="auth-submit mt-3">Inizia chat</button>
        </Form>
      </Modal.Body>
    </Modal>
  )
}

export default NewChatModal
