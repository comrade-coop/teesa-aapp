import { ReactNode } from "react";

export type MessageUiStateModel = {
  id: string;
  role: 'user' | 'assistant';
  display: ReactNode;
};