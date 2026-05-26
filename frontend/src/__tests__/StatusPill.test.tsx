import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { StatusPill, RoleBadge } from "../components/StatusPill";

describe("StatusPill Component", () => {
  it("renders 'To Do' status correctly", () => {
    const { container } = render(<StatusPill status="todo" />);
    expect(container.firstChild).toHaveTextContent("To Do");
    expect(container.firstChild).toHaveClass("bg-muted");
  });

  it("renders 'In Progress' status correctly", () => {
    const { container } = render(<StatusPill status="in_progress" />);
    expect(container.firstChild).toHaveTextContent("In Progress");
    expect(container.firstChild).toHaveClass("bg-info-soft");
  });

  it("renders 'Done' status correctly", () => {
    const { container } = render(<StatusPill status="done" />);
    expect(container.firstChild).toHaveTextContent("Done");
    expect(container.firstChild).toHaveClass("bg-accent-soft");
  });
});

describe("RoleBadge Component", () => {
  it("renders 'Admin' role correctly", () => {
    const { container } = render(<RoleBadge role="admin" />);
    expect(container.firstChild).toHaveTextContent("Admin");
    expect(container.firstChild).toHaveClass("bg-accent-soft");
  });

  it("renders 'Member' role correctly", () => {
    const { container } = render(<RoleBadge role="member" />);
    expect(container.firstChild).toHaveTextContent("Member");
    expect(container.firstChild).toHaveClass("bg-muted");
  });
});
