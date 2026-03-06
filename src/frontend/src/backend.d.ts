import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface JobInput {
    sourceVideo: ExternalBlob;
    videoType: VideoType;
    notes: string;
    referenceVideo: ExternalBlob;
}
export type Principal = Principal;
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface RevenueSummary {
    totalRevenue: bigint;
    completedJobsCount: bigint;
    paidJobsCount: bigint;
}
export interface Job {
    status: JobStatus;
    completedAt?: Time;
    clientId: Principal;
    assignedEditorId?: Principal;
    createdAt: Time;
    jobId: string;
    sourceVideo: ExternalBlob;
    finalVideo?: ExternalBlob;
    videoType: VideoType;
    notes: string;
    stripeSessionId?: string;
    price: bigint;
    referenceVideo: ExternalBlob;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface UserProfile {
    appRole: AppUserRole;
    name: string;
}
export enum AppUserRole {
    client = "client",
    editor = "editor"
}
export enum JobStatus {
    assigned = "assigned",
    pending_payment = "pending_payment",
    pending = "pending",
    in_progress = "in_progress",
    completed = "completed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VideoType {
    photo_to_video = "photo_to_video",
    long_ = "long",
    small = "small",
    medium = "medium"
}
export interface backendInterface {
    adminSubmitFinalVideo(jobId: string, finalVideo: ExternalBlob): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignJob(jobId: string, editorId: Principal): Promise<void>;
    confirmPayment(jobId: string, stripeSessionId: string): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    getAllJobs(): Promise<Array<Job>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getJob(jobId: string): Promise<Job>;
    getRevenueSummary(): Promise<RevenueSummary>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setAdminPasskey(passkey: string): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    submitFinalVideo(jobId: string, finalVideo: ExternalBlob): Promise<void>;
    submitJob(input: JobInput): Promise<string>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    verifyAdminPasskey(passkey: string): Promise<boolean>;
}
