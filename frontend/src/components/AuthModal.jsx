import { useState } from 'react'
import { Alert, Form, Modal, Nav } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const emptyRegister = { nome: '', cognome: '', username: '', email: '', password: '' }

function validateLogin(form) {
  const errors = {}
  if (!form.identifier.trim()) errors.identifier = 'Campo obbligatorio'
  if (!form.password) errors.password = 'Campo obbligatorio'
  return errors
}

function validateRegister(form) {
  const errors = {}
  if (!form.nome.trim()) errors.nome = 'Campo obbligatorio'
  if (!form.cognome.trim()) errors.cognome = 'Campo obbligatorio'
  if (!form.username.trim()) errors.username = 'Campo obbligatorio'
  else if (/\s/.test(form.username)) errors.username = 'Niente spazi nello username'

  if (!form.email.trim()) errors.email = 'Campo obbligatorio'
  else if (!EMAIL_RE.test(form.email)) errors.email = 'Email non valida'

  if (!form.password) errors.password = 'Campo obbligatorio'
  else if (form.password.length < 6) errors.password = 'Minimo 6 caratteri'

  return errors
}

function AuthModal() {
  const { login, register } = useAuth()
  const [tab, setTab] = useState('login')
  const [formError, setFormError] = useState('')
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' })
  const [loginErrors, setLoginErrors] = useState({})
  const [registerForm, setRegisterForm] = useState(emptyRegister)
  const [registerErrors, setRegisterErrors] = useState({})

  function handleTab(key) {
    setTab(key)
    setFormError('')
  }

  async function submitLogin(e) {
    e.preventDefault()
    const errors = validateLogin(loginForm)
    setLoginErrors(errors)
    if (Object.keys(errors).length) return

    try {
      await login(loginForm)
    } catch (err) {
      setFormError(err.message)
    }
  }

  async function submitRegister(e) {
    e.preventDefault()
    const errors = validateRegister(registerForm)
    setRegisterErrors(errors)
    if (Object.keys(errors).length) return

    try {
      await register(registerForm)
    } catch (err) {
      setFormError(err.message)
    }
  }

  function registerField(name, label, type = 'text') {
    return (
      <Form.Group className="mb-2">
        <Form.Label>{label}</Form.Label>
        <Form.Control
          type={type}
          value={registerForm[name]}
          isInvalid={!!registerErrors[name]}
          onChange={(e) => {
            setRegisterForm({ ...registerForm, [name]: e.target.value })
            setRegisterErrors({ ...registerErrors, [name]: '' })
          }}
        />
        <Form.Control.Feedback type="invalid">{registerErrors[name]}</Form.Control.Feedback>
      </Form.Group>
    )
  }

  return (
    <Modal show centered backdrop="static" keyboard={false} className="auth-modal">
      <Modal.Body>
        <h1 className="auth-title">Chattiamo</h1>
        <Nav variant="pills" justify activeKey={tab} onSelect={handleTab} className="auth-tabs">
          <Nav.Item>
            <Nav.Link eventKey="login">Accedi</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="register">Registrati</Nav.Link>
          </Nav.Item>
        </Nav>

        {formError && <Alert variant="danger" className="py-2">{formError}</Alert>}

        {tab === 'login' ? (
          <Form onSubmit={submitLogin} noValidate>
            <Form.Group className="mb-2">
              <Form.Label>Username o email</Form.Label>
              <Form.Control
                value={loginForm.identifier}
                isInvalid={!!loginErrors.identifier}
                onChange={(e) => {
                  setLoginForm({ ...loginForm, identifier: e.target.value })
                  setLoginErrors({ ...loginErrors, identifier: '' })
                }}
              />
              <Form.Control.Feedback type="invalid">{loginErrors.identifier}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={loginForm.password}
                isInvalid={!!loginErrors.password}
                onChange={(e) => {
                  setLoginForm({ ...loginForm, password: e.target.value })
                  setLoginErrors({ ...loginErrors, password: '' })
                }}
              />
              <Form.Control.Feedback type="invalid">{loginErrors.password}</Form.Control.Feedback>
            </Form.Group>
            <button type="submit" className="auth-submit">Accedi</button>
          </Form>
        ) : (
          <Form onSubmit={submitRegister} noValidate>
            {registerField('nome', 'Nome')}
            {registerField('cognome', 'Cognome')}
            {registerField('username', 'Username')}
            {registerField('email', 'Email', 'email')}
            {registerField('password', 'Password', 'password')}
            <button type="submit" className="auth-submit mt-1">Crea account</button>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  )
}

export default AuthModal
