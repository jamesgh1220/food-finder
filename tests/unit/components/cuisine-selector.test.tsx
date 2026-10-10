import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  CuisineSelector,
  type CuisineOption,
} from "@/components/filters/cuisine-selector";
import { messages } from "@/lib/i18n/messages";

const cuisines: CuisineOption[] = [
  { id: "italiana", name: "Italiana" },
  { id: "mexicana", name: "Mexicana" },
];

describe("CuisineSelector", () => {
  it("renders the label bound to a native select reflecting the value", () => {
    render(
      <CuisineSelector cuisines={cuisines} value="italiana" onChange={vi.fn()} />,
    );

    const select = screen.getByLabelText(messages.cuisines.label);
    expect(select).toBeInstanceOf(HTMLSelectElement);
    expect(select).toHaveValue("italiana");
  });

  it("maps the 'Todas' option to null", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CuisineSelector cuisines={cuisines} value="italiana" onChange={onChange} />,
    );

    await user.selectOptions(
      screen.getByLabelText(messages.cuisines.label),
      "",
    );

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("maps a cuisine option to its id", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CuisineSelector cuisines={cuisines} value={null} onChange={onChange} />,
    );

    await user.selectOptions(
      screen.getByLabelText(messages.cuisines.label),
      "mexicana",
    );

    expect(onChange).toHaveBeenCalledWith("mexicana");
  });

  it("shows 'Todas' selected when the value is null", () => {
    render(
      <CuisineSelector cuisines={cuisines} value={null} onChange={vi.fn()} />,
    );

    expect(screen.getByLabelText(messages.cuisines.label)).toHaveValue("");
    expect(
      screen.getByRole("option", { name: messages.cuisines.all }),
    ).toBeInTheDocument();
  });
});
