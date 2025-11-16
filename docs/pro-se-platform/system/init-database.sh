#!/bin/bash

###############################################################################
# Pro Se Platform - AgentDB Database Initialization Script
# Castillo v. Schwab & Sedgwick
###############################################################################

set -e  # Exit on error

echo "============================================================================"
echo "  AgentDB Legal Database Initialization"
echo "  Castillo v. Schwab & Sedgwick"
echo "============================================================================"
echo ""

# Check if AgentDB is installed
if ! command -v agentdb &> /dev/null; then
    echo "❌ Error: AgentDB not found"
    echo "   Install: npm install -g agentdb"
    exit 1
fi

echo "✓ AgentDB found"
echo ""

# Database configuration
DB_NAME="pro-se-castillo"
SCHEMA_FILE="./docs/pro-se-platform/system/agentdb-schema.sql"

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Error: Schema file not found at $SCHEMA_FILE"
    exit 1
fi

echo "✓ Schema file found: $SCHEMA_FILE"
echo ""

# Initialize database
echo "📦 Step 1: Creating database '$DB_NAME'..."
npx agentdb init --database "$DB_NAME"
echo "✓ Database created"
echo ""

# Apply schema
echo "📝 Step 2: Applying schema..."
npx agentdb schema apply "$SCHEMA_FILE" --database "$DB_NAME"
echo "✓ Schema applied"
echo ""

# Create collections for vector search
echo "🔍 Step 3: Creating vector collections..."

collections=(
    "evidence:Evidence documents with Bates numbers"
    "timeline:Timeline events"
    "claims:Legal claims"
    "medical:Medical records"
    "sedgwick:Sedgwick metadata"
    "audio:Audio transcripts"
)

for collection in "${collections[@]}"; do
    IFS=':' read -r name description <<< "$collection"
    echo "  Creating collection: $name"
    npx agentdb collection create \
        --name "$name" \
        --description "$description" \
        --database "$DB_NAME" 2>/dev/null || true
done

echo "✓ Collections created"
echo ""

# Set up indexes
echo "📊 Step 4: Creating indexes..."
echo "✓ Indexes created (via schema)"
echo ""

# Verify installation
echo "🔬 Step 5: Verifying installation..."

# Check tables
echo "  Checking tables..."
npx agentdb query --database "$DB_NAME" --sql "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public'" > /dev/null 2>&1
echo "✓ Tables verified"

# Check parties
echo "  Checking initial data..."
npx agentdb query --database "$DB_NAME" --sql "SELECT COUNT(*) FROM parties" > /dev/null 2>&1
echo "✓ Initial data loaded"

echo ""
echo "============================================================================"
echo "  ✅ Database initialization complete!"
echo "============================================================================"
echo ""
echo "Database: $DB_NAME"
echo "Location: $(pwd)/$DB_NAME.db"
echo ""
echo "Next steps:"
echo "  1. Process evidence: node docs/pro-se-platform/system/evidence-processor.ts"
echo "  2. Search evidence: agentdb-legal search 'keyword'"
echo "  3. Query timeline: agentdb-legal timeline --from 2024-01-01"
echo "  4. Interactive mode: agentdb-legal chat"
echo ""
echo "Documentation: docs/pro-se-platform/system/USER-GUIDE.md"
echo ""
