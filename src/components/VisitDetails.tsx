import React, { useState, useEffect } from 'react'
import VisitStatusIndicator from './VisitStatusIndicator'
import { API_URL, endpoints } from '../config/api'

export interface Visitor {
  nombre: string
  apellido_paterno: string
  apellido_materno?: string
  correo: string
  telefono: string
  tipo_doc?: string
  documento_url?: string
}

export interface VisitData {
  id: number
  visitor: Visitor
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | string
  fecha: string
  hora_inicio: string
  motivo: string
  Departamentos?: {
    nombre: string
    ubicacion: string
  }
  // Fallbacks para soporte flexible de datos
  estado?: string
  depto_id?: number
}

export interface VisitDetailsProps {
  visitId?: number | string
  visitData?: VisitData
  onQrResendSuccess?: () => void
  onQrResendError?: (error: string) => void
}

export default function VisitDetails({
  visitId,
  visitData: initialVisitData,
  onQrResendSuccess,
  onQrResendError,
}: VisitDetailsProps) {
  const [visit, setVisit] = useState<VisitData | null>(initialVisitData || null)
  const [loading, setLoading] = useState<boolean>(!initialVisitData && !!visitId)
  const [error, setError] = useState<string | null>(null)
  const [resendingQr, setResendingQr] = useState<boolean>(false)
  const [qrStatus, setQrStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Normalizador de estados para VisitStatusIndicator
  const getNormalizedStatus = (statusStr?: string): 'pending' | 'confirmed' | 'completed' | 'cancelled' => {
    if (!statusStr) return 'pending'
    const s = statusStr.toLowerCase()
    if (s === 'confirmed' || s === 'aprobada' || s === 'approved') return 'confirmed'
    if (s === 'completed' || s === 'finalizada' || s === 'finished') return 'completed'
    if (s === 'cancelled' || s === 'cancelada') return 'cancelled'
    return 'pending'
  }

  const fetchVisitDetails = async (id: number | string) => {
    setLoading(true)
    setError(null)
    try {
      const targetUrl = `${API_URL}/api/visits/${id}`
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`)
      }

      const json = await response.json()
      if (json.success && json.data) {
        setVisit(json.data)
      } else {
        throw new Error(json.error || 'No se pudieron cargar los detalles de la visita.')
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialVisitData) {
      setVisit(initialVisitData)
      setLoading(false)
      setError(null)
    } else if (visitId) {
      fetchVisitDetails(visitId)
    }
  }, [visitId, initialVisitData])

  const handleResendQr = async () => {
    if (!visit) return
    setResendingQr(true)
    setQrStatus('idle')

    try {
      const response = await fetch(endpoints.resendQR, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          visita_id: visit.id,
          correo: visit.visitor?.correo || (visit as any).correo,
        }),
      })

      if (response.ok) {
        setQrStatus('success')
        if (onQrResendSuccess) onQrResendSuccess()
      } else {
        const json = await response.json()
        throw new Error(json.error || 'Error al reenviar el código QR.')
      }
    } catch (err: any) {
      setQrStatus('error')
      if (onQrResendError) onQrResendError(err.message || 'Error de conexión.')
    } finally {
      setResendingQr(false)
    }
  }

  const formatFecha = (iso: string) => {
    if (!iso) return 'N/A'
    try {
      return new Date(iso).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Mexico_City',
      })
    } catch {
      return iso
    }
  }

  if (loading) {
    return (
      <div data-testid="visit-details-loading" className="d-flex flex-column align-items-center justify-content-center p-5 rounded-4 bg-white border shadow-sm" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="text-muted fw-medium font-heading">Obteniendo detalles de la visita...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="visit-details-error" className="p-5 rounded-4 bg-white border border-danger shadow-sm text-center">
        <div className="text-danger mb-3" style={{ fontSize: '3rem' }}>
          <i className="fas fa-exclamation-circle"></i>
        </div>
        <h3 className="text-danger font-heading mb-2">Error al cargar</h3>
        <p className="text-muted mb-4">{error}</p>
        {visitId && (
          <button
            data-testid="retry-btn"
            onClick={() => fetchVisitDetails(visitId)}
            className="btn btn-primary"
            style={{ minWidth: '150px' }}
          >
            <i className="fas fa-redo me-2"></i> Reintentar
          </button>
        )}
      </div>
    )
  }

  if (!visit) {
    return (
      <div data-testid="visit-details-empty" className="p-5 rounded-4 bg-white border shadow-sm text-center">
        <div className="text-muted mb-3" style={{ fontSize: '3rem', opacity: 0.5 }}>
          <i className="fas fa-folder-open"></i>
        </div>
        <h3 className="text-primary font-heading mb-2">Sin información</h3>
        <p className="text-muted">No hay datos disponibles para mostrar sobre esta visita.</p>
      </div>
    )
  }

  const normalizedStatus = getNormalizedStatus(visit.status || visit.estado)
  const isConfirmed = normalizedStatus === 'confirmed'

  // Datos del visitante
  const visitorName = visit.visitor
    ? `${visit.visitor.nombre} ${visit.visitor.apellido_paterno} ${visit.visitor.apellido_materno || ''}`.trim()
    : 'Visitante Desconocido'

  return (
    <div data-testid="visit-details-card" className="card border-0 shadow-lg rounded-4 overflow-hidden bg-white animate-fade-up">
      {/* Cabecera Principal */}
      <div className="p-4 text-white d-flex justify-content-between align-items-center flex-wrap gap-3" style={{ background: 'linear-gradient(135deg, #0F4C75, #0D1B2A)' }}>
        <div>
          <span className="text-uppercase tracking-wider fw-bold font-heading text-accent-light" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>
            Detalle del Registro
          </span>
          <h2 className="m-0 fs-4 fw-bold text-white mt-1">Visita #{visit.id}</h2>
        </div>
        <VisitStatusIndicator status={normalizedStatus} />
      </div>

      <div className="p-4">
        <div className="row g-4">
          {/* Columna 1: Información de la Visita */}
          <div className="col-12 col-md-6 border-end-md">
            <h3 className="fs-5 fw-bold text-primary font-heading mb-3 pb-2 border-bottom">
              <i className="fas fa-calendar-check me-2 text-accent"></i>Datos de la Cita
            </h3>
            
            <div className="d-flex flex-column gap-3">
              <div className="d-flex flex-column">
                <span className="text-uppercase fw-semibold text-muted font-heading" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                  Fecha Programada
                </span>
                <span className="fw-medium text-dark">{formatFecha(visit.fecha)}</span>
              </div>

              <div className="row">
                <div className="col-6">
                  <span className="text-uppercase fw-semibold text-muted font-heading" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                    Hora de Entrada
                  </span>
                  <span className="fw-medium text-dark d-block">
                    <i className="far fa-clock me-1 text-accent"></i>{visit.hora_inicio}
                  </span>
                </div>
                <div className="col-6">
                  <span className="text-uppercase fw-semibold text-muted font-heading" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                    Ubicación / Campus
                  </span>
                  <span className="fw-medium text-dark d-block">
                    <i className="fas fa-map-marker-alt me-1 text-accent"></i>{visit.Departamentos?.ubicacion || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="d-flex flex-column">
                <span className="text-uppercase fw-semibold text-muted font-heading" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                  Área o Departamento
                </span>
                <span className="fw-medium text-dark">
                  <i className="fas fa-building me-1 text-accent"></i>{visit.Departamentos?.nombre || 'Sin asignar'}
                </span>
              </div>

              <div className="d-flex flex-column">
                <span className="text-uppercase fw-semibold text-muted font-heading" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                  Motivo de la Visita
                </span>
                <span className="fw-normal text-dark bg-light p-3 rounded-3 border mt-1" style={{ fontSize: '0.9rem' }}>
                  {visit.motivo}
                </span>
              </div>
            </div>
          </div>

          {/* Columna 2: Información del Visitante */}
          <div className="col-12 col-md-6">
            <h3 className="fs-5 fw-bold text-primary font-heading mb-3 pb-2 border-bottom">
              <i className="fas fa-user-tie me-2 text-accent"></i>Información del Visitante
            </h3>

            <div className="d-flex flex-column gap-3">
              <div className="d-flex flex-column">
                <span className="text-uppercase fw-semibold text-muted font-heading" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                  Nombre Completo
                </span>
                <span className="fw-semibold text-dark fs-5">{visitorName}</span>
              </div>

              <div className="d-flex flex-column">
                <span className="text-uppercase fw-semibold text-muted font-heading" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                  Correo Electrónico
                </span>
                <a href={`mailto:${visit.visitor?.correo}`} className="fw-medium text-accent">
                  <i className="fas fa-envelope me-1"></i>{visit.visitor?.correo}
                </a>
              </div>

              <div className="row">
                <div className="col-6">
                  <span className="text-uppercase fw-semibold text-muted font-heading" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                    Teléfono
                  </span>
                  <span className="fw-medium text-dark d-block">
                    <i className="fas fa-phone me-1 text-accent"></i>{visit.visitor?.telefono}
                  </span>
                </div>
                <div className="col-6">
                  <span className="text-uppercase fw-semibold text-muted font-heading" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                    Identificación
                  </span>
                  <span className="fw-medium text-dark d-block">
                    <i className="fas fa-id-card me-1 text-accent"></i>{visit.visitor?.tipo_doc || 'No provista'}
                  </span>
                </div>
              </div>

              {visit.visitor?.documento_url && (
                <div className="mt-2">
                  <a
                    href={visit.visitor.documento_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline btn-sm d-inline-flex align-items-center gap-2"
                  >
                    <i className="fas fa-paperclip"></i> Ver Documento Adjunto
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección de acciones (e.g. reenviar QR) */}
        {isConfirmed && (
          <div className="mt-4 pt-3 border-top d-flex justify-content-center">
            <button
              data-testid="resend-qr-btn"
              onClick={handleResendQr}
              disabled={resendingQr}
              className="btn btn-primary px-4 py-2.5 rounded-3 d-inline-flex align-items-center gap-2"
            >
              {resendingQr ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Reenviando...
                </>
              ) : qrStatus === 'success' ? (
                <>
                  <i className="fas fa-check text-white"></i> ¡QR Reenviado!
                </>
              ) : qrStatus === 'error' ? (
                <>
                  <i className="fas fa-exclamation-triangle"></i> Falló el reenvío. Reintentar
                </>
              ) : (
                <>
                  <i className="fas fa-qrcode"></i> Reenviar Código QR a Correo
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
