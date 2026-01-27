import { UserLock, Group, File, Users, BookOpen, FileText, GraduationCap, BookMarked, FileQuestion, ImagePlus, Upload, Sparkles } from "lucide-react";

export interface SidebarLink {
    title: string;
    url: string;
    icon: React.ElementType;
}

export const SIDEBAR_LINKS = {
    adminManagement: [
        {
            title: "Admin List",
            url: "/admin",
            icon: UserLock
        }
    ],
    examManagement: [
        {
            title: "Exam Onboarding",
            url: "/exam-management",
            icon: GraduationCap
        },
        {
            title: "Paper Onboarding",
            url: "/paper-management",
            icon: BookOpen
        },
        {
            title: "Subject Management",
            url: "/subject-management",
            icon: BookMarked
        },
        {
            title: "Question Onboarding",
            url: "/question-onboarding",
            icon: FileQuestion
        },
        {
            title: "AI Bulk Upload",
            url: "/bulk-question-upload",
            icon: Sparkles
        },
        {
            title: "Media Library",
            url: "/media-library",
            icon: ImagePlus
        }
    ],
    contentManagement: [
        {
            title: "Category listing",
            url: "/content/category-listing",
            icon: Group
        },
        {
            title: "Blog management",
            url: "/blog-management",
            icon: File
        },
        {
            title: "AI Blog Writer",
            url: "/blog-agent",
            icon: Sparkles
        },
        {
            title: "Author management",
            url: "/author-management",
            icon: Users
        }
    ]
}