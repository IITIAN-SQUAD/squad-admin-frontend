import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { authorService, Author } from "@/src/services/author.service";
import { toast } from "sonner";

// Define form schema
const authorFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  description: z.string().optional(),
  profilePicture: z.string().optional(),
});

type AuthorFormValues = z.infer<typeof authorFormSchema>;

interface AuthorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  author?: Author | null; // For editing existing author
  onSave?: () => void; // Callback after save
}

export function AuthorDialog({ isOpen, onOpenChange, author, onSave }: AuthorDialogProps) {
  const isEditing = !!author;
  const [loading, setLoading] = useState(false);
  
  // Initialize form
  const form = useForm<AuthorFormValues>({
    resolver: zodResolver(authorFormSchema),
    defaultValues: {
      name: "",
      email: "",
      description: "",
      profilePicture: "",
    },
  });

  // Update form values when editing an existing author
  useEffect(() => {
    if (author) {
      form.reset({
        name: author.name || "",
        email: author.email || "",
        description: author.description || "",
        profilePicture: author.profilePicture || "",
      });
    } else {
      form.reset({
        name: "",
        email: "",
        description: "",
        profilePicture: "",
      });
    }
  }, [author, form]);

  // Form submission handler
  const onSubmit = async (data: AuthorFormValues) => {
    try {
      setLoading(true);
      
      if (isEditing && author) {
        // Update existing author
        await authorService.updateAuthor(author.id, {
          ...data,
          profilePicture: data.profilePicture || undefined,
        });
        toast.success("Author updated successfully");
      } else {
        // Create new author
        await authorService.createAuthor({
          ...data,
          profilePicture: data.profilePicture || undefined,
        });
        toast.success("Author created successfully");
      }
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
      
      // Call save callback if provided
      if (onSave) {
        onSave();
      }
    } catch (error: any) {
      console.error("Failed to save author:", error);
      
      // Extract the most specific error message
      let errorMessage = isEditing ? "Failed to update author" : "Failed to create author";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.errorDescription) {
        errorMessage = error.errorDescription;
      } else if (error?.errorCode) {
        errorMessage = `Error: ${error.errorCode}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Author" : "Create Author"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Author name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Author bio or description" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="profilePicture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Picture URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Profile picture URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : (isEditing ? "Update" : "Create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
