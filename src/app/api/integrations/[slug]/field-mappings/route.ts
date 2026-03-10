import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrations, fieldMappings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(eq(integrations.slug, slug));

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    const mappings = await db
      .select()
      .from(fieldMappings)
      .where(eq(fieldMappings.integrationId, integration.id));

    return NextResponse.json(mappings);
  } catch (error) {
    console.error('Error fetching field mappings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch field mappings' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const body = await request.json();

    const [integration] = await db
      .select()
      .from(integrations)
      .where(eq(integrations.slug, slug));

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Delete existing mappings and replace
    await db
      .delete(fieldMappings)
      .where(eq(fieldMappings.integrationId, integration.id));

    if (body.mappings && body.mappings.length > 0) {
      await db.insert(fieldMappings).values(
        body.mappings.map(
          (m: {
            sourceField: string;
            destinationField: string;
            transform?: string;
            isRequired?: boolean;
            defaultValue?: string;
          }) => ({
            integrationId: integration.id,
            sourceField: m.sourceField,
            destinationField: m.destinationField,
            transform: m.transform ?? null,
            isRequired: m.isRequired ?? false,
            defaultValue: m.defaultValue ?? null,
          })
        )
      );
    }

    const updated = await db
      .select()
      .from(fieldMappings)
      .where(eq(fieldMappings.integrationId, integration.id));

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating field mappings:', error);
    return NextResponse.json(
      { error: 'Failed to update field mappings' },
      { status: 500 }
    );
  }
}
