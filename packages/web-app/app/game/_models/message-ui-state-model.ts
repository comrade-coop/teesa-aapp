import { ReactNode } from "react";

export interface MessageUiStateModel {
  id: string;
  userId: string | undefined;
  timestamp: number;
  display: ReactNode;
};