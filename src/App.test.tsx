import { render, screen } from '@testing-library/react';
import App from './App';

test('renders headline and weekly question section', () => {
  render(<App />);
  expect(
    screen.getByText(/see how life actually feels in other countries/i)
  ).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
  expect(screen.getByText(/this week's question/i)).toBeInTheDocument();
});
