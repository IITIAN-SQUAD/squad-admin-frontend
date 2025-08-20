import { UserLock, Group } from "lucide-react";

export const SIDEBAR_LINKS = {
    adminManagement: [
        {
            title: "Admin List",
            url: "/admin",
            icon: UserLock
        }
    ],
    contentManagement: [
        {
            title: "Category listing",
            url: "/content/category-listing",
            icon: Group
        }
    ]
}