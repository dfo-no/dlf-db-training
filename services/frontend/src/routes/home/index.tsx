import { createFileRoute, type ErrorComponentProps} from "@tanstack/react-router";

//utils 
import {  getUserProfileInfo } from "./utils/loader.ts"

//components
import { UsersPage, UsersError } from './components/components';

export const Route = createFileRoute("/")({
  loader: () => getUserProfileInfo(),
  component: UsersPage,
  errorComponent: UsersError,
});



