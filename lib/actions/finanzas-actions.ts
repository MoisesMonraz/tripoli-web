"use server";

import { cookies } from "next/headers";
import admin from "firebase-admin";
import { db } from "../firebase/server";
import { verifyAdminSession, getAdminSessionCookieName } from "../security/adminSession";
import {
  calculateDistribution,
  getPrestador,
  getCoordinador,
  ACCIONISTAS_SEED,
} from "../finanzas";
import type { Categoria, Servicio, Venta } from "../../types/finanzas";

async function verifyAccess() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  const session = verifyAdminSession(token);
  if (!session) return null;
  return session;
}

function serializeVenta(id: string, data: admin.firestore.DocumentData): Venta {
  return {
    id,
    cliente: data.cliente ?? "",
    fechaEmision: data.fechaEmision ?? "",
    servicio: data.servicio,
    categoria: data.categoria,
    contacto: data.contacto ?? "",
    montoNeto: data.montoNeto ?? 0,
    iva: data.iva ?? 0,
    montoTotal: data.montoTotal ?? 0,
    prestadorServicio: data.prestadorServicio ?? "",
    coordinadorCategoria: data.coordinadorCategoria ?? "",
    distribucion: data.distribucion ?? null,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
  };
}

export async function getVentas(): Promise<{ ok: boolean; ventas?: Venta[]; error?: string }> {
  const session = await verifyAccess();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!db) return { ok: false, error: "Firebase no inicializado" };

  try {
    const snap = await db.collection("ventas").orderBy("createdAt", "desc").get();
    const ventas = snap.docs.map((d) => serializeVenta(d.id, d.data()));
    return { ok: true, ventas };
  } catch (err) {
    console.error("getVentas error:", err);
    return { ok: false, error: "Error al obtener ventas" };
  }
}

type VentaInput = {
  cliente: string;
  fechaEmision: string;
  servicio: Servicio;
  categoria: Categoria;
  contacto: string;
  montoNeto: number;
};

export async function createVenta(
  input: VentaInput
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const session = await verifyAccess();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!db) return { ok: false, error: "Firebase no inicializado" };

  try {
    const dist = calculateDistribution(
      input.montoNeto,
      input.servicio,
      input.categoria,
      input.contacto
    );
    const data = {
      cliente: input.cliente.trim(),
      fechaEmision: input.fechaEmision,
      servicio: input.servicio,
      categoria: input.categoria,
      contacto: input.contacto,
      montoNeto: input.montoNeto,
      iva: dist.iva,
      montoTotal: dist.totalConIva,
      prestadorServicio: getPrestador(input.servicio),
      coordinadorCategoria: getCoordinador(input.categoria),
      distribucion: dist,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const ref = await db.collection("ventas").add(data);
    return { ok: true, id: ref.id };
  } catch (err) {
    console.error("createVenta error:", err);
    return { ok: false, error: "Error al guardar la venta" };
  }
}

export async function updateVenta(
  id: string,
  input: VentaInput
): Promise<{ ok: boolean; error?: string }> {
  const session = await verifyAccess();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!db) return { ok: false, error: "Firebase no inicializado" };

  try {
    const dist = calculateDistribution(
      input.montoNeto,
      input.servicio,
      input.categoria,
      input.contacto
    );
    const data = {
      cliente: input.cliente.trim(),
      fechaEmision: input.fechaEmision,
      servicio: input.servicio,
      categoria: input.categoria,
      contacto: input.contacto,
      montoNeto: input.montoNeto,
      iva: dist.iva,
      montoTotal: dist.totalConIva,
      prestadorServicio: getPrestador(input.servicio),
      coordinadorCategoria: getCoordinador(input.categoria),
      distribucion: dist,
    };
    await db.collection("ventas").doc(id).update(data);
    return { ok: true };
  } catch (err) {
    console.error("updateVenta error:", err);
    return { ok: false, error: "Error al actualizar la venta" };
  }
}

export async function deleteVenta(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await verifyAccess();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!db) return { ok: false, error: "Firebase no inicializado" };

  try {
    await db.collection("ventas").doc(id).delete();
    return { ok: true };
  } catch (err) {
    console.error("deleteVenta error:", err);
    return { ok: false, error: "Error al eliminar la venta" };
  }
}

export async function seedAccionistas(): Promise<{ ok: boolean }> {
  const session = await verifyAccess();
  if (!session) return { ok: false };
  if (!db) return { ok: false };

  try {
    const snap = await db.collection("accionistas").get();
    if (snap.empty) {
      const batch = db.batch();
      for (const a of ACCIONISTAS_SEED) {
        const id = a.nombre
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "-")
          .toLowerCase();
        batch.set(db.collection("accionistas").doc(id), a);
      }
      await batch.commit();
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
