import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import VisitStatusIndicator from '@/components/VisitStatusIndicator'

describe('VisitStatusIndicator', () => {
  // ── Texto descriptivo según estado ───────────────────────────────

  describe('muestra el texto descriptivo correcto', () => {
    it('muestra "Pendiente" cuando el estado es pending', () => {
      render(<VisitStatusIndicator status="pending" />)
      expect(screen.getByTestId('visit-status-label')).toHaveTextContent('Pendiente')
    })

    it('muestra "Confirmada" cuando el estado es confirmed', () => {
      render(<VisitStatusIndicator status="confirmed" />)
      expect(screen.getByTestId('visit-status-label')).toHaveTextContent('Confirmada')
    })

    it('muestra "Completada" cuando el estado es completed', () => {
      render(<VisitStatusIndicator status="completed" />)
      expect(screen.getByTestId('visit-status-label')).toHaveTextContent('Completada')
    })

    it('muestra "Cancelada" cuando el estado es cancelled', () => {
      render(<VisitStatusIndicator status="cancelled" />)
      expect(screen.getByTestId('visit-status-label')).toHaveTextContent('Cancelada')
    })
  })

  // ── Clases de color Tailwind ─────────────────────────────────────

  describe('aplica las clases de color Tailwind correctas', () => {
    it('aplica clases amarillas para pending', () => {
      render(<VisitStatusIndicator status="pending" />)
      const indicator = screen.getByTestId('visit-status')
      expect(indicator.className).toContain('bg-yellow-100')
      expect(indicator.className).toContain('text-yellow-800')
      expect(indicator.className).toContain('border-yellow-300')
    })

    it('aplica clases verdes para confirmed', () => {
      render(<VisitStatusIndicator status="confirmed" />)
      const indicator = screen.getByTestId('visit-status')
      expect(indicator.className).toContain('bg-green-100')
      expect(indicator.className).toContain('text-green-800')
      expect(indicator.className).toContain('border-green-300')
    })

    it('aplica clases azules para completed', () => {
      render(<VisitStatusIndicator status="completed" />)
      const indicator = screen.getByTestId('visit-status')
      expect(indicator.className).toContain('bg-blue-100')
      expect(indicator.className).toContain('text-blue-800')
      expect(indicator.className).toContain('border-blue-300')
    })

    it('aplica clases rojas para cancelled', () => {
      render(<VisitStatusIndicator status="cancelled" />)
      const indicator = screen.getByTestId('visit-status')
      expect(indicator.className).toContain('bg-red-100')
      expect(indicator.className).toContain('text-red-800')
      expect(indicator.className).toContain('border-red-300')
    })
  })

  // ── Íconos apropiados ────────────────────────────────────────────

  describe('muestra el ícono apropiado', () => {
    it('muestra ⏳ para pending', () => {
      render(<VisitStatusIndicator status="pending" />)
      expect(screen.getByTestId('visit-status-icon')).toHaveTextContent('⏳')
    })

    it('muestra ✅ para confirmed', () => {
      render(<VisitStatusIndicator status="confirmed" />)
      expect(screen.getByTestId('visit-status-icon')).toHaveTextContent('✅')
    })

    it('muestra 🏁 para completed', () => {
      render(<VisitStatusIndicator status="completed" />)
      expect(screen.getByTestId('visit-status-icon')).toHaveTextContent('🏁')
    })

    it('muestra ❌ para cancelled', () => {
      render(<VisitStatusIndicator status="cancelled" />)
      expect(screen.getByTestId('visit-status-icon')).toHaveTextContent('❌')
    })
  })

  // ── Accesibilidad ────────────────────────────────────────────────

  describe('accesibilidad', () => {
    it('el ícono tiene un role="img" con aria-label descriptivo', () => {
      render(<VisitStatusIndicator status="pending" />)
      const icon = screen.getByTestId('visit-status-icon')
      expect(icon).toHaveAttribute('role', 'img')
      expect(icon).toHaveAttribute('aria-label', 'Pendiente')
    })
  })

  // ── Renderizado general ──────────────────────────────────────────

  describe('renderizado general', () => {
    it('renderiza sin errores para cada estado válido', () => {
      const statuses = ['pending', 'confirmed', 'completed', 'cancelled'] as const
      statuses.forEach((status) => {
        const { unmount } = render(<VisitStatusIndicator status={status} />)
        expect(screen.getByTestId('visit-status')).toBeInTheDocument()
        unmount()
      })
    })
  })
})
