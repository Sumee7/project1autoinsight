import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import App from "../App";

describe("App basic render test", () => {
  it("renders without crashing", () => {
    render(<App />);
  });
});
it("shows upload screen on first load", () => {
  const { getByText } = render(<App />);
  
 expect(
  getByText(/sign in/i)
).toBeTruthy();
});
