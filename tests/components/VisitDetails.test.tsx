import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import VisitDetails, { type VisitData } from '@/components/VisitDetails'

// Mock de la configuracion de la API
vi.mock('../src/config/api', () => ({
  API_URL: 'https://unexcused-temerariously-daria.ngrok-free.dev',
  endpoints: {
    resendQR: 'https://unexcused-temerariously-daria.ngrok-free.dev/api/visits/resend-qr'
  }
}))

const mockVisit: VisitData = {
  id: 123,
  status: 'confirmed',
  fecha: '2026-05-20T10:00:00Z',
  hora_inicio: '10:30 AM',
  motivo: 'Reunión de vinculación universitaria',
  Departamentos: {
    nombre: 'Rectoría',
    ubicacion: 'Edificio A, Planta Alta'
  },
  visitor: {
    nombre: 'Juan',
    apellido_paterno: 'Pérez',
    apellido_materno: 'Gómez',
    correo: 'juan.perez@example.com',
    telefono: '1234567890',
    tipo_doc: 'INE',
    documento_url: 'https://example.com/ine.pdf'
  }
}

describe('VisitDetails Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── 1. RENDERIZADO CON PROPS DIRECTOS ───────────────────────────
  describe('Renderizado directo con props', () => {
    it('muestra la informacion de la visita y del visitante correctamente', () => {
      render(<VisitDetails visitData={mockVisit} />)

      // Verificar cabecera
      expect(screen.getByText('Visita #123')).toBeInTheDocument()
      expect(screen.getByTestId('visit-status-label')).toHaveTextContent('Confirmada')

      // Verificar datos de la cita
      expect(screen.getByText('Edificio A, Planta Alta')).toBeInTheDocument()
      expect(screen.getByText('Rectoría')).toBeInTheDocument()
      expect(screen.getByText('Reunión de vinculación universitaria')).toBeInTheDocument()
      expect(screen.getByText(/10:30 AM/i)).toBeInTheDocument()

      // Verificar datos del visitante
      expect(screen.getByText('Juan Pérez Gómez')).toBeInTheDocument()
      expect(screen.getByText('juan.perez@example.com')).toBeInTheDocument()
      expect(screen.getByText('1234567890')).toBeInTheDocument()
      expect(screen.getByText('INE')).toBeInTheDocument()
      
      // Verificar documento adjunto
      const docLink = screen.getByText('Ver Documento Adjunto')
      expect(docLink).toBeInTheDocument()
      expect(docLink).toHaveAttribute('href', 'https://example.com/ine.pdf')
    })
  })

  // ── 2. CARGA ASÍNCRONA DESDE API ──────────────────────────────
  describe('Carga asíncrona mediante visitId', () => {
    it('muestra indicador de carga y luego renderiza los datos tras consulta exitosa', async () => {
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockVisit })
        })
      )
      vi.stubGlobal('fetch', mockFetch)

      render(<VisitDetails visitId={123} />)

      // Verificar que muestra cargando al inicio
      expect(screen.getByTestId('visit-details-loading')).toBeInTheDocument()

      // Esperar a que se carguen los datos
      await waitFor(() => {
        expect(screen.queryByTestId('visit-details-loading')).not.toBeInTheDocument()
      })

      expect(screen.getByTestId('visit-details-card')).toBeInTheDocument()
      expect(screen.getByText('Visita #123')).toBeInTheDocument()
      expect(screen.getByText('Juan Pérez Gómez')).toBeInTheDocument()
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://unexcused-temerariously-daria.ngrok-free.dev/api/visits/123',
        expect.any(Object)
      )
    })

    it('muestra pantalla de error si la peticion falla', async () => {
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500
        })
      )
      vi.stubGlobal('fetch', mockFetch)

      render(<VisitDetails visitId={123} />)

      await waitFor(() => {
        expect(screen.getByTestId('visit-details-error')).toBeInTheDocument()
      })

      expect(screen.getByText('Error del servidor: 500')).toBeInTheDocument()
      expect(screen.getByTestId('retry-btn')).toBeInTheDocument()
    })

    it('permite reintentar la peticion tras un fallo', async () => {
      const mockFetch = vi.fn()
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
            status: 500
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockVisit })
          })
        )
      vi.stubGlobal('fetch', mockFetch)

      render(<VisitDetails visitId={123} />)

      await waitFor(() => {
        expect(screen.getByTestId('visit-details-error')).toBeInTheDocument()
      })

      const retryBtn = screen.getByTestId('retry-btn')
      fireEvent.click(retryBtn)

      // Debe mostrar cargando de nuevo y luego cargar exitosamente
      expect(screen.getByTestId('visit-details-loading')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByTestId('visit-details-card')).toBeInTheDocument()
      })

      expect(screen.getByText('Juan Pérez Gómez')).toBeInTheDocument()
    })
  })

  // ── 3. INTERACCIONES (REENVÍO DE QR) ──────────────────────────
  describe('Accion de reenviar codigo QR', () => {
    it('llama al endpoint de reenvio de QR y actualiza el boton al tener exito', async () => {
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true
        })
      )
      vi.stubGlobal('fetch', mockFetch)

      render(<VisitDetails visitData={mockVisit} />)

      const resendBtn = screen.getByTestId('resend-qr-btn')
      expect(resendBtn).toBeInTheDocument()

      fireEvent.click(resendBtn)

      // Debe mostrar cargando
      expect(screen.getByText('Reenviando...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('¡QR Reenviado!')).toBeInTheDocument()
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://unexcused-temerariously-daria.ngrok-free.dev/api/visits/resend-qr',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            visita_id: 123,
            correo: 'juan.perez@example.com'
          })
        })
      )
    })

    it('muestra estado de error si el reenvio falla', async () => {
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Límite de envíos excedido' })
        })
      )
      vi.stubGlobal('fetch', mockFetch)

      render(<VisitDetails visitData={mockVisit} />)

      const resendBtn = screen.getByTestId('resend-qr-btn')
      fireEvent.click(resendBtn)

      await waitFor(() => {
        expect(screen.getByText('Falló el reenvío. Reintentar')).toBeInTheDocument()
      })
    })
  })
})
