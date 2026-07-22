import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

describe("Tabs", () => {
  it("renders underline tabs with a clear active state", () => {
    render(
      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
        </TabsList>
        <TabsContent value="attendance">Attendance content</TabsContent>
        <TabsContent value="roster">Roster content</TabsContent>
      </Tabs>,
    );

    const activeTab = screen.getByRole("tab", { name: "Attendance" });
    const inactiveTab = screen.getByRole("tab", { name: "Roster" });

    expect(activeTab).toHaveAttribute("data-state", "active");
    expect(activeTab).toHaveClass("border-brand-navy", "text-foreground");
    expect(inactiveTab).toHaveAttribute("data-state", "inactive");
    expect(inactiveTab).toHaveClass("text-muted-foreground");
  });

  it("shows only the active tab panel", () => {
    render(
      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
        </TabsList>
        <TabsContent value="attendance">Attendance content</TabsContent>
        <TabsContent value="roster">Roster content</TabsContent>
      </Tabs>,
    );

    expect(screen.getByText("Attendance content")).toBeInTheDocument();
    expect(screen.queryByText("Roster content")).not.toBeInTheDocument();
  });
});
