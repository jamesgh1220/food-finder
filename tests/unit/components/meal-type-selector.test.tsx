import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MealTypeSelector } from "@/components/filters/meal-type-selector";
import {
  defaultMealTypes,
  mealTypeLabels,
  messages,
} from "@/lib/i18n/messages";

describe("MealTypeSelector", () => {
  it("renders an accessible radiogroup with a single checked option", () => {
    render(<MealTypeSelector value="LUNCH" onChange={vi.fn()} />);

    expect(
      screen.getByRole("radiogroup", { name: messages.mealTypes.legend }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(defaultMealTypes.length);
    expect(
      screen.getByRole("radio", { name: mealTypeLabels.LUNCH }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("radio", { name: mealTypeLabels.BREAKFAST }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("selects an option on click and reports it through onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MealTypeSelector value="BREAKFAST" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: mealTypeLabels.LUNCH }));

    expect(onChange).toHaveBeenCalledWith("LUNCH");
  });

  it("moves the selection and focus with ArrowRight", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MealTypeSelector value="BREAKFAST" onChange={onChange} />);

    const breakfast = screen.getByRole("radio", {
      name: mealTypeLabels.BREAKFAST,
    });
    breakfast.focus();
    expect(breakfast).toHaveFocus();

    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith("LUNCH");
    expect(
      screen.getByRole("radio", { name: mealTypeLabels.LUNCH }),
    ).toHaveFocus();
  });

  it("wraps around with ArrowLeft from the first option", () => {
    const onChange = vi.fn();
    render(<MealTypeSelector value="BREAKFAST" onChange={onChange} />);

    fireEvent.keyDown(
      screen.getByRole("radio", { name: mealTypeLabels.BREAKFAST }),
      { key: "ArrowLeft" },
    );

    expect(onChange).toHaveBeenCalledWith("ANY");
  });
});
