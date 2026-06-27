import { render, screen } from '@testing-library/react';

function Greeting({ name }: { name: string }) {
  return <div>Hello, {name}!</div>;
}

describe('Greeting', () => {
  it('renders the name', () => {
    render(<Greeting name="TaskCo" />);
    expect(screen.getByText('Hello, TaskCo!')).toBeInTheDocument();
  });
});
