import React from 'react';

/**
 * Lightweight skeleton wrapper matching the shape of a portfolio section.
 * Renders a themed grey-pulsing placeholder with a header row + N tiles of
 * the requested kind so the layout doesn't shift when data lands.
 *
 * Kinds:
 *   'hero'     — full-width hero placeholder
 *   'stack'    — heading + 3 stacked bars
 *   'grid-3'   — heading + 3-column card grid
 *   'grid-4'   — heading + 4-column card grid
 *   'timeline' — heading + vertical timeline entries
 */

const barStyle = { backgroundColor: 'var(--bg-alt)' };

const HeaderBar = () => (
  <div className="max-w-2xl">
    <div className="skeleton h-3 w-24 rounded" style={barStyle} />
    <div className="skeleton h-10 sm:h-14 w-4/5 mt-3 rounded" style={barStyle} />
    <div className="skeleton h-4 w-2/3 mt-4 rounded" style={barStyle} />
  </div>
);

const Tile = ({ h = 'h-40' }) => (
  <div className={`skeleton ${h} w-full rounded-2xl`} style={barStyle} />
);

const SectionSkeleton = ({ kind = 'grid-3', className = '' }) => (
  <section className={`section-y ${className}`} aria-busy="true" data-testid={`skeleton-${kind}`}>
    <div className="container-x">
      <HeaderBar />
      <div className="mt-10">
        {kind === 'hero' && <div className="skeleton h-64 rounded-3xl" style={barStyle} />}
        {kind === 'stack' && (
          <div className="space-y-3 max-w-3xl">
            <div className="skeleton h-4 w-full rounded" style={barStyle} />
            <div className="skeleton h-4 w-11/12 rounded" style={barStyle} />
            <div className="skeleton h-4 w-9/12 rounded" style={barStyle} />
          </div>
        )}
        {kind === 'grid-3' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Tile /><Tile /><Tile />
          </div>
        )}
        {kind === 'grid-4' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <Tile h="h-24" /><Tile h="h-24" /><Tile h="h-24" /><Tile h="h-24" />
          </div>
        )}
        {kind === 'timeline' && (
          <div className="space-y-4 max-w-3xl">
            <Tile h="h-24" /><Tile h="h-24" />
          </div>
        )}
      </div>
    </div>
  </section>
);

export default SectionSkeleton;
