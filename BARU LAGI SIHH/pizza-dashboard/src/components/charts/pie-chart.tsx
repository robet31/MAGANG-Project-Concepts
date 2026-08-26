'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

interface PieChartProps {
  data: { label: string; value: number }[]
  title: string
}

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444']

export function PieChart({ data, title }: PieChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 320 })
  const [activeSlice, setActiveSlice] = useState<string | null>(null)

  const total = data.reduce((acc, d) => acc + d.value, 0)

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 320
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
        .attr('x', dimensions.width * 0.3)
        .attr('y', dimensions.height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#9ca3af')
        .style('font-size', '14px')
        .text('No Data Available')
      return
    }

    const width = dimensions.width
    const height = dimensions.height
    const radius = Math.min(width, height) / 2 - 50

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)

    const color = d3.scaleOrdinal<string>()
      .domain(data.map(d => d.label))
      .range(COLORS)

    const pie = d3.pie<{ label: string; value: number }>()
      .value(d => d.value)
      .sort(null)

    const arc = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius)

    const hoverArc = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius + 10)

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc')

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.label))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', hoverArc as any)
          .attr('opacity', 0.9)
        setActiveSlice(d.data.label)
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', arc as any)
          .attr('opacity', 1)
        setActiveSlice(null)
      })

  }, [data, dimensions])

  return (
    <div ref={containerRef} className="w-full">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
        <svg ref={svgRef} width={Math.min(dimensions.width * 0.75, 280)} height={dimensions.height} />
        
        <div className="flex flex-col gap-2 min-w-[140px]">
          {data.map((item, i) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
            const isActive = activeSlice === item.label
            
            return (
              <div 
                key={item.label} 
                className={`flex items-center gap-2 px-2 py-1 rounded transition-all ${isActive ? 'bg-gray-100' : ''}`}
              >
                <div 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-sm text-gray-700 min-w-[80px]">{item.label}</span>
                <span className="text-sm font-medium">{item.value}</span>
                <span className="text-xs text-gray-400">({percentage}%)</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
