'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

interface LineChartProps {
  data: { label: string; value: number }[]
  title: string
  color?: string
}

export function LineChart({ data, title, color = '#3b82f6' }: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 300 })
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null)

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 300
        })
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!svgRef.current || !data.length || dimensions.width === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    if (data.length === 0 || data.every(d => d.value === 0)) {
      svg.append('text')
        .attr('x', dimensions.width / 2)
        .attr('y', dimensions.height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#9ca3af')
        .style('font-size', '14px')
        .text('No Data Available')
      return
    }

    const margin = { top: 20, right: 20, bottom: 60, left: 50 }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scalePoint()
      .domain(data.map(d => d.label))
      .range([0, width])
      .padding(0.5)

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 0])
      .nice()
      .range([height, 0])

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .style('font-size', '11px')

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .style('font-size', '11px')

    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'lineGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%')

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0.3)

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0)

    const area = d3.area<{ label: string; value: number }>()
      .x(d => x(d.label) || 0)
      .y0(height)
      .y1(d => y(d.value))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#lineGradient)')
      .attr('d', area)

    const line = d3.line<{ label: string; value: number }>()
      .x(d => x(d.label) || 0)
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 3)
      .attr('d', line)

    const dots = g.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.label) || 0)
      .attr('cy', d => y(d.value))
      .attr('r', 5)
      .attr('fill', color)
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')

    dots.on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(150)
        .attr('r', 8)
      
      const cx = x(d.label) || 0
      const rect = (this as SVGCircleElement).getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (containerRect) {
        setTooltip({
          x: margin.left + cx,
          y: rect.top - containerRect.top,
          label: d.label,
          value: d.value
        })
      }
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(150)
        .attr('r', 5)
      setTooltip(null)
    })

  }, [data, dimensions, color])

  return (
    <div ref={containerRef} className="w-full relative">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
      {tooltip && (
        <div 
          className="absolute z-10 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg pointer-events-none"
          style={{ 
            left: tooltip.x, 
            top: tooltip.y - 50,
            transform: 'translateX(-50%)'
          }}
        >
          <p className="font-medium">{tooltip.label}</p>
          <p className="text-gray-300">{tooltip.value.toLocaleString()} orders</p>
        </div>
      )}
    </div>
  )
}
