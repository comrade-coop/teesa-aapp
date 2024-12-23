import { ReactNode } from "react";

export interface MessageUiStateModel {
  id: string;
  userId: string;
  timestamp: number;
  display: ReactNode;
};