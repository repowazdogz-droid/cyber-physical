#!/usr/bin/env tsx
/**
 * Check lens loading state
 */

import { query } from '../src/db/client.js';
import { getLenses } from '../src/db/queries.js';

async function checkLenses() {
  try {
    console.log('\n=== Checking Lenses ===\n');

    // Check if lenses table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lenses'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ lenses table does NOT exist');
      console.log('   Run migrations first: npm run migrate\n');
      return;
    }
    
    console.log('✅ lenses table exists\n');

    // Check total lenses
    const totalResult = await query('SELECT COUNT(*) as count FROM lenses');
    const totalCount = parseInt(totalResult.rows[0].count);
    console.log(`Total lenses in table: ${totalCount}`);

    // Check active lenses
    const activeResult = await query('SELECT COUNT(*) as count FROM lenses WHERE is_active = true');
    const activeCount = parseInt(activeResult.rows[0].count);
    console.log(`Active lenses: ${activeCount}\n`);

    // List all lenses
    const allLenses = await query('SELECT id, name, orientation, is_active, version FROM lenses ORDER BY name');
    if (allLenses.rows.length > 0) {
      console.log('=== All Lenses in Database ===');
      allLenses.rows.forEach(row => {
        console.log(`  ${row.is_active ? '✓' : '✗'} ${row.name} (${row.orientation}, v${row.version}, id: ${row.id.substring(0, 8)}...)`);
      });
      console.log('');
    } else {
      console.log('❌ No lenses found in database\n');
    }

    // Test getLenses function
    console.log('=== Testing getLenses(true) ===');
    const lenses = await getLenses(true);
    console.log(`Returned ${lenses.length} active lenses`);
    if (lenses.length > 0) {
      lenses.forEach(l => {
        console.log(`  ✓ ${l.name} (${l.orientation}, v${l.version})`);
      });
    } else {
      console.log('  ❌ getLenses(true) returned empty array');
      console.log('  → This is why analysis pipeline fails!\n');
    }

    // Check expected lenses
    const expectedLenses = ['analytical', 'adversarial', 'historical_analogy', 'stakeholder_impact', 'premortem'];
    console.log('\n=== Expected vs Actual ===');
    expectedLenses.forEach(name => {
      const found = allLenses.rows.find(r => r.name === name);
      if (found) {
        console.log(`  ${found.is_active ? '✓' : '✗'} ${name} - ${found.is_active ? 'active' : 'INACTIVE'}`);
      } else {
        console.log(`  ❌ ${name} - MISSING`);
      }
    });

    console.log('\n=== Recommendation ===');
    if (totalCount === 0) {
      console.log('  Run: npm run seed');
    } else if (activeCount === 0) {
      console.log('  Lenses exist but all are inactive. Check database or re-seed.');
    } else if (activeCount < 5) {
      console.log('  Some lenses missing. Run: npm run seed');
    } else {
      console.log('  ✅ Lenses are properly seeded');
    }
    console.log('');

    process.exit(0);
  } catch (err: any) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

checkLenses();
