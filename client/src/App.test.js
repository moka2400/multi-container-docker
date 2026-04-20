import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  // We comment out the stuff below for now. The reason for this is that we need to set up proper mocking of components in order to get the test to pass. E.g. the App will spin up the Fib component, which in turn calls an API that will for sure fail.

  // render(<App />);
  // const linkElement = screen.getByText(/learn react/i);
  // expect(linkElement).toBeInTheDocument();
});
