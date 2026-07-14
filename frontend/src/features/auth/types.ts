export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface LoginInput {
    email: string;
    password: string;
    remember?: boolean;
}

export interface RegisterInput {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}