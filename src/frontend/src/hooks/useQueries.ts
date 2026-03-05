import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppUserRole, Job, ShoppingItem, UserProfile } from "../backend";
import { AppUserRole as AppUserRoleEnum } from "../backend";
import { ExternalBlob } from "../backend";
import { useActor } from "./useActor";

// ── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isStripeConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      secretKey,
      allowedCountries,
    }: {
      secretKey: string;
      allowedCountries: string[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.setStripeConfiguration({ secretKey, allowedCountries });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isStripeConfigured"] });
    },
  });
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

export function useGetAllJobs() {
  const { actor, isFetching } = useActor();

  return useQuery<Job[]>({
    queryKey: ["allJobs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllJobs();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

export function useGetJob(jobId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Job>({
    queryKey: ["job", jobId],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getJob(jobId);
    },
    enabled: !!actor && !isFetching && !!jobId,
    refetchInterval: 8_000,
  });
}

export type CheckoutSession = {
  id: string;
  url: string;
};

export function useSubmitJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sourceVideoFile,
      referenceVideoFile,
      notes,
      onSourceProgress,
      onRefProgress,
    }: {
      sourceVideoFile: File;
      referenceVideoFile: File;
      notes: string;
      onSourceProgress?: (p: number) => void;
      onRefProgress?: (p: number) => void;
    }): Promise<string> => {
      if (!actor) throw new Error("Actor not available");

      const [srcBytes, refBytes] = await Promise.all([
        sourceVideoFile.arrayBuffer().then((b) => new Uint8Array(b)),
        referenceVideoFile.arrayBuffer().then((b) => new Uint8Array(b)),
      ]);

      const sourceBlob = ExternalBlob.fromBytes(srcBytes).withUploadProgress(
        onSourceProgress || (() => {}),
      );
      const referenceBlob = ExternalBlob.fromBytes(refBytes).withUploadProgress(
        onRefProgress || (() => {}),
      );

      const checkoutUrl = await actor.submitJob({
        sourceVideo: sourceBlob,
        referenceVideo: referenceBlob,
        notes,
        price: BigInt(2999),
      });

      return checkoutUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allJobs"] });
    },
  });
}

export function useConfirmPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      stripeSessionId,
    }: {
      jobId: string;
      stripeSessionId: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.confirmPayment(jobId, stripeSessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allJobs"] });
    },
  });
}

export function useAssignJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      editorId,
    }: {
      jobId: string;
      editorId: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.assignJob(jobId, Principal.fromText(editorId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allJobs"] });
    },
  });
}

export function useSubmitFinalVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      videoFile,
      onProgress,
    }: {
      jobId: string;
      videoFile: File;
      onProgress?: (p: number) => void;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const bytes = new Uint8Array(await videoFile.arrayBuffer());
      const finalVideo = ExternalBlob.fromBytes(bytes).withUploadProgress(
        onProgress || (() => {}),
      );
      await actor.submitFinalVideo({ jobId, finalVideo });
    },
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ["allJobs"] });
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
    },
  });
}

export function useAssignCallerUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      user,
      role,
    }: {
      user: string;
      role: "admin" | "user";
    }) => {
      if (!actor) throw new Error("Actor not available");
      const { UserRole } = await import("../backend");
      await actor.assignCallerUserRole(
        Principal.fromText(user),
        role === "admin" ? UserRole.admin : UserRole.user,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (items: ShoppingItem[]): Promise<CheckoutSession> => {
      if (!actor) throw new Error("Actor not available");
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/payment-success`;
      const cancelUrl = `${baseUrl}/payment-failure`;
      const result = await actor.createCheckoutSession(
        items,
        successUrl,
        cancelUrl,
      );
      const session = JSON.parse(result) as CheckoutSession;
      if (!session?.url) throw new Error("Stripe session missing url");
      return session;
    },
  });
}

export function useGetStripeSessionStatus(sessionId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["stripeSession", sessionId],
    queryFn: async () => {
      if (!actor || !sessionId) throw new Error("Not ready");
      return actor.getStripeSessionStatus(sessionId);
    },
    enabled: !!actor && !isFetching && !!sessionId,
    retry: 3,
  });
}
