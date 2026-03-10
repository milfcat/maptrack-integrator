import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeyRegistry, apiCredentials } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt, maskValue } from '@/lib/crypto';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const registryId = parseInt(id, 10);

  try {
    const body = await request.json();
    const { label, value } = body;

    if (!label && !value) {
      return NextResponse.json(
        { error: 'At least label or value must be provided' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(apiKeyRegistry)
      .where(eq(apiKeyRegistry.id, registryId));

    if (!existing) {
      return NextResponse.json(
        { error: 'Registry key not found' },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (label) updates.label = label;
    if (value) {
      const { encrypted, iv } = encrypt(value);
      updates.encryptedValue = encrypted;
      updates.iv = iv;
    }

    await db
      .update(apiKeyRegistry)
      .set(updates)
      .where(eq(apiKeyRegistry.id, registryId));

    const [updated] = await db
      .select()
      .from(apiKeyRegistry)
      .where(eq(apiKeyRegistry.id, registryId));

    return NextResponse.json({
      id: updated.id,
      label: updated.label,
      service: updated.service,
      credentialType: updated.credentialType,
      maskedValue: maskValue(decrypt(updated.encryptedValue, updated.iv)),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error('Error updating registry key:', error);
    return NextResponse.json(
      { error: 'Failed to update registry key' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const registryId = parseInt(id, 10);

  try {
    // Check if any integrations are using this registry key
    const linked = await db
      .select({ id: apiCredentials.id })
      .from(apiCredentials)
      .where(eq(apiCredentials.registryKeyId, registryId));

    if (linked.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${linked.length} integration credential(s) are linked to this key. Unlink them first.`,
        },
        { status: 409 }
      );
    }

    await db
      .delete(apiKeyRegistry)
      .where(eq(apiKeyRegistry.id, registryId));

    return NextResponse.json({ status: 'deleted' });
  } catch (error) {
    console.error('Error deleting registry key:', error);
    return NextResponse.json(
      { error: 'Failed to delete registry key' },
      { status: 500 }
    );
  }
}
