import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrations, campaignMappings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

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
      .from(campaignMappings)
      .where(eq(campaignMappings.integrationId, integration.id));

    return NextResponse.json(mappings);
  } catch (error) {
    console.error('Error fetching campaign mappings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign mappings' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
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

    const body = await request.json();
    const {
      sourceCampaignId,
      sourceCampaignName,
      destinationCampaignId,
      destinationCampaignName,
    } = body;

    if (!sourceCampaignId || !destinationCampaignId) {
      return NextResponse.json(
        { error: 'sourceCampaignId and destinationCampaignId are required' },
        { status: 400 }
      );
    }

    const [mapping] = await db
      .insert(campaignMappings)
      .values({
        integrationId: integration.id,
        sourceCampaignId: String(sourceCampaignId),
        sourceCampaignName: sourceCampaignName ?? null,
        destinationCampaignId: String(destinationCampaignId),
        destinationCampaignName: destinationCampaignName ?? null,
      })
      .onConflictDoUpdate({
        target: [
          campaignMappings.integrationId,
          campaignMappings.sourceCampaignId,
        ],
        set: {
          destinationCampaignId: String(destinationCampaignId),
          destinationCampaignName: destinationCampaignName ?? null,
          sourceCampaignName: sourceCampaignName ?? null,
        },
      })
      .returning();

    return NextResponse.json(mapping, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign mapping:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign mapping' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
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

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Mapping id is required' },
        { status: 400 }
      );
    }

    await db
      .delete(campaignMappings)
      .where(
        and(
          eq(campaignMappings.id, id),
          eq(campaignMappings.integrationId, integration.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign mapping:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign mapping' },
      { status: 500 }
    );
  }
}
