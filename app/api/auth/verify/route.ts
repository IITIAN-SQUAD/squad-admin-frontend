import { NextRequest, NextResponse } from 'next/server';

const mockAdmin = {
  id: '1',
  email: 'super@iitian-squad.com',
  name: 'Super Admin',
  roleId: '1',
  role: {
    id: '1',
    name: 'Super Admin',
    type: 'super_admin',
    permissions: [
      'exam_management',
      'subject_management',
      'paper_management',
      'question_management',
      'blog_management',
      'author_management',
      'media_management',
      'admin_management',
      'bulk_upload',
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  isActive: true,
  passwordSet: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // TODO: Verify JWT token
    // - Decode token
    // - Check expiration
    // - Fetch admin from database
    
    if (token.startsWith('mock-jwt-token-')) {
      return NextResponse.json({ admin: mockAdmin });
    }

    return NextResponse.json(
      { message: 'Invalid token' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
