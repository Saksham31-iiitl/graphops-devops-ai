import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

function extractError(err) {
  return (
    err.response?.data?.detail ||
    err.response?.data?.message ||
    (err.code === 'ECONNABORTED' ? 'Request timed out. The backend may be processing a large request.' : null) ||
    (err.message?.includes('Network') ? 'Unable to reach backend. Ensure the server is running on port 8000.' : null) ||
    err.message ||
    'An unexpected error occurred.'
  )
}

export const createIncident = async ({ incident, logs, severity, environment, region }) => {
  try {
    const { data } = await api.post('/incident', { incident, logs, severity, environment, region })
    return data
  } catch (err) {
    throw new Error(extractError(err))
  }
}

export const getIncidents = async () => {
  try {
    const { data } = await api.get('/incidents')
    return data
  } catch (err) {
    throw new Error(extractError(err))
  }
}

export const searchIncidents = async (query) => {
  try {
    const { data } = await api.get('/incidents', { params: { q: query } })
    return data
  } catch (err) {
    throw new Error(extractError(err))
  }
}

export const updateIncidentStatus = async (id, status) => {
  try {
    const { data } = await api.patch(`/incidents/${id}/status`, { status })
    return data
  } catch (err) {
    throw new Error(extractError(err))
  }
}
