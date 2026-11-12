import { createBrowserRouter } from "react-router-dom";
import UserLayout from "./GUIs/Layouts/User/UserLayout";

const router = createBrowserRouter([
    {
        path: "/",
        element: <UserLayout />
    }, {
        path: "/admin"
    }
]);