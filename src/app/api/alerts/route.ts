import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      ticker,
      threshold,
      type,
      message,
      name,
      condition_type,
      trigger_mode,
      expires_at,
      upper_bound,
      lower_bound,
    } = body;

    if (!ticker || !threshold || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: ticker, threshold, type' },
        { status: 400 }
      );
    }

    const insertData: any = {
      user_id: userId,
      ticker: ticker.toUpperCase(),
      threshold: parseFloat(threshold),
      type,
      active: true,
    };

    // Add optional fields if provided
    if (message) insertData.message = message;
    if (name) insertData.name = name;
    if (condition_type) insertData.condition_type = condition_type;
    if (trigger_mode) insertData.trigger_mode = trigger_mode;
    if (expires_at) insertData.expires_at = expires_at;
    if (upper_bound !== undefined) insertData.upper_bound = parseFloat(upper_bound);
    if (lower_bound !== undefined) insertData.lower_bound = parseFloat(lower_bound);

    const { data, error } = await supabase
      .from('alerts')
      // @ts-ignore - Supabase types issue
      .insert(insertData)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      ticker,
      threshold,
      type,
      active,
      message,
      name,
      condition_type,
      trigger_mode,
      expires_at,
      upper_bound,
      lower_bound,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (ticker !== undefined) updateData.ticker = ticker.toUpperCase();
    if (threshold !== undefined) updateData.threshold = parseFloat(threshold);
    if (type !== undefined) updateData.type = type;
    if (active !== undefined) updateData.active = active;
    if (message !== undefined) updateData.message = message;
    if (name !== undefined) updateData.name = name;
    if (condition_type !== undefined) updateData.condition_type = condition_type;
    if (trigger_mode !== undefined) updateData.trigger_mode = trigger_mode;
    if (expires_at !== undefined) updateData.expires_at = expires_at;
    if (upper_bound !== undefined) updateData.upper_bound = parseFloat(upper_bound);
    if (lower_bound !== undefined) updateData.lower_bound = parseFloat(lower_bound);

    const { data, error } = await supabase
      .from('alerts')
      // @ts-ignore - Supabase types issue
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing alert id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
