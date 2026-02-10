/**
 * Job Card Materials Controller
 * CRUD operations for materials/parts used in job cards
 */

const pool = require('../config/db');

/**
 * Get materials for a job card
 * GET /api/job-cards/:id/materials
 */
const getJobCardMaterials = async (req, res) => {
    try {
        const { id } = req.params;

        const [materials] = await pool.execute(
            `SELECT 
        jcm.id, jcm.job_card_id, jcm.material_name, jcm.quantity, 
        jcm.unit_price, jcm.total_price, jcm.inventory_item_id,
        ii.part_code, ii.available_stock
      FROM job_card_materials jcm
      LEFT JOIN inventory_items ii ON jcm.inventory_item_id = ii.id
      WHERE jcm.job_card_id = ?
      ORDER BY jcm.created_at DESC`,
            [id]
        );

        const formattedMaterials = materials.map(m => ({
            id: m.id,
            jobCardId: m.job_card_id,
            materialName: m.material_name,
            quantity: m.quantity,
            unitPrice: m.unit_price,
            totalPrice: m.total_price,
            inventoryItemId: m.inventory_item_id,
            partCode: m.part_code,
            availableStock: m.available_stock
        }));

        res.json({
            success: true,
            data: formattedMaterials,
            count: formattedMaterials.length
        });
    } catch (error) {
        console.error('Get job card materials error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch materials'
        });
    }
};

/**
 * Add material to job card
 * POST /api/job-cards/:id/materials
 */
const addJobCardMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { inventoryItemId, quantity } = req.body;

        if (!inventoryItemId || !quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid inventory item and quantity are required'
            });
        }

        // Get inventory item details
        const [items] = await pool.execute(
            'SELECT id, part_name, unit_price, sales_price, purchase_price, available_stock FROM inventory_items WHERE id = ?',
            [inventoryItemId]
        );

        if (items.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Inventory item not found'
            });
        }

        const item = items[0];

        // Check stock availability
        if (item.available_stock < quantity) {
            return res.status(400).json({
                success: false,
                error: `Insufficient stock. Available: ${item.available_stock}`
            });
        }

        const unitPrice = item.sales_price || item.unit_price || 0;
        const unitCost = item.purchase_price || 0;
        const totalPrice = unitPrice * quantity;
        const totalCost = unitCost * quantity;

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Add material to job card
            const [result] = await connection.execute(
                `INSERT INTO job_card_materials 
          (job_card_id, inventory_item_id, material_name, quantity, unit_price, unit_cost, total_price, total_cost, stock_deducted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [id, inventoryItemId, item.part_name, quantity, unitPrice, unitCost, totalPrice, totalCost]
            );

            // Deduct from inventory
            await connection.execute(
                'UPDATE inventory_items SET available_stock = available_stock - ? WHERE id = ?',
                [quantity, inventoryItemId]
            );

            await connection.commit();

            res.status(201).json({
                success: true,
                message: 'Material added successfully',
                data: {
                    id: result.insertId,
                    materialName: item.part_name,
                    quantity,
                    unitPrice,
                    unitCost,
                    totalPrice,
                    totalCost
                }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Add job card material error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add material'
        });
    }
};

/**
 * Remove material from job card
 * DELETE /api/job-cards/:id/materials/:materialId
 */
const removeJobCardMaterial = async (req, res) => {
    try {
        const { id, materialId } = req.params;

        // Get material details
        const [materials] = await pool.execute(
            'SELECT id, inventory_item_id, quantity, stock_deducted FROM job_card_materials WHERE id = ? AND job_card_id = ?',
            [materialId, id]
        );

        if (materials.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Material not found'
            });
        }

        const material = materials[0];

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Return stock to inventory ONLY if it was previously deducted
            if (material.inventory_item_id && material.stock_deducted === 1) {
                await connection.execute(
                    'UPDATE inventory_items SET available_stock = available_stock + ? WHERE id = ?',
                    [material.quantity, material.inventory_item_id]
                );
            }

            // Delete material
            await connection.execute(
                'DELETE FROM job_card_materials WHERE id = ?',
                [materialId]
            );

            await connection.commit();

            res.json({
                success: true,
                message: 'Material removed successfully'
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Remove job card material error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove material'
        });
    }
};

module.exports = {
    getJobCardMaterials,
    addJobCardMaterial,
    removeJobCardMaterial
};
