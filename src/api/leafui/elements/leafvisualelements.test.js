import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LEAFVisualElements } from './leafvisualelements.js';

// Minimal mock props for LEAFVisualElements
const minimalProps = {
  data: [],
  etaTree: {},
  dimensions: { width: 100, height: 100 },
  zRange: { min: 0, max: 10 },
};

describe('LEAFVisualElements', () => {
  it('renders the main visual element container', () => {
    render(<LEAFVisualElements {...minimalProps} />);
    const container = screen.getByRole('region', { hidden: true }) || document.getElementById('leafvisualelement');
    // Fallback to getElementById if role is not set
    expect(container).toBeTruthy();
    expect(container.id).toBe('leafvisualelement');
  });
}); 