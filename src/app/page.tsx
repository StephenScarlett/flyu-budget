"use client";

import dynamic from "next/dynamic";

const BudgetApp = dynamic(() => import("./BudgetApp"), { ssr: false });

export default function Home() {
  return <BudgetApp />;
}
