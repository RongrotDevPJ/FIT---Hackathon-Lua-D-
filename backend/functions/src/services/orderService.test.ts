// // backend/functions/src/services/orderService.test.ts

// // -------------------------------------------------------------------
// // MOCK FIRESTORE COMPONENTS (MOVED TO THE TOP TO FIX REFERENCE ERRORS)
// // -------------------------------------------------------------------
// const mockDocRef = (id: string, data: any) => ({
//     id,
//     data: () => data,
//     get: jest.fn(() => ({
//         id,
//         exists: true,
//         data: () => data,
//         get: (field: string) => data[field], 
//     })),
// });

// // Mock Query Chain object: All query methods return mockQuery itself for chaining
// const mockQuery = {
//     where: jest.fn().mockReturnThis(),
//     orderBy: jest.fn().mockReturnThis(),
//     limit: jest.fn().mockReturnThis(),
//     startAfter: jest.fn().mockReturnThis(),
//     get: jest.fn(),
// };

// // Mock Collection Reference
// const mockCollection = {
//     add: jest.fn(),
//     doc: jest.fn((id: string) => mockDocRef(id, {})), 
//     where: mockQuery.where,
//     orderBy: mockQuery.orderBy,
//     limit: mockQuery.limit,
//     startAfter: mockQuery.startAfter,
//     get: mockQuery.get,
// };

// // Mock Database (db)
// const mockDb = {
//     collection: jest.fn(() => mockCollection),
// };

// // -------------------------------------------------------------------
// // IMPORTS AND MOCKS
// // -------------------------------------------------------------------

// import * as orderService from './orderService';
// import { Order, OrderType, OrderStatus, PriceStatus } from './orderService';
// import { Timestamp } from 'firebase-admin/firestore';
// import * as admin from 'firebase-admin';
// import * as priceService from '../services/priceService'; 

// // Global variables to hold the reference to the mock implementation for assertions
// let mockTimestampNow: jest.Mock; 
// let mockEvaluatePrice: jest.Mock; 

// // Mock firebase-admin/firestore for Timestamp.now()
// jest.mock('firebase-admin/firestore', () => ({
//   Timestamp: {
//     now: jest.fn(), 
//   },
// }));

// // Mock firebase-admin
// jest.mock('firebase-admin', () => ({
//     apps: [], 
//     initializeApp: jest.fn(),
//     firestore: jest.fn().mockReturnValue({
//         collection: jest.fn().mockReturnThis(),
//         settings: jest.fn(),
//     }),
// }));

// // Mock priceService
// jest.mock('../services/priceService', () => ({
//     evaluatePrice: jest.fn(),
//     PriceStatus: {
//         BELOW_REF: 'below_ref',
//         NORMAL: 'normal',
//         ABOVE_REF: 'above_ref',
//         NO_REF: 'no_ref',
//     },
// }));

// // Mock the file that exports 'db' (../config/firestore)
// jest.mock('../config/firestore', () => ({
//     db: mockDb, 
// }));

// // -------------------------------------------------------------------
// // TEST SUITE: orderService
// // -------------------------------------------------------------------

// describe('OrderService', () => {

//     const fakeOwnerId = 'user-123';
//     // FIX (TS2741): เพิ่ม status: 'open' ตามที่ Order Interface กำหนด
//     const fakeOrderPayload: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'refAvgPrice' | 'priceStatus' | 'priceDiffPercent'> = {
//         ownerId: fakeOwnerId,
//         type: 'sell',
//         grade: 'A',
//         province: 'เชียงใหม่',
//         requestedPrice: 100,
//         amountKg: 500,
//         status: 'open',
//     };

//     beforeEach(() => {
//         jest.clearAllMocks();
        
//         // 1. กำหนด Mock Implementation ของ Timestamp.now()
//         const TimestampModuleMock = jest.mocked(Timestamp.now as jest.Mock);
//         TimestampModuleMock.mockImplementation(() => ({ toDate: () => new Date() } as unknown as Timestamp));
//         mockTimestampNow = TimestampModuleMock; 

//         // 2. กำหนด Mock Implementation ของ priceService.evaluatePrice 
//         const EvaluatePriceMock = jest.mocked(priceService.evaluatePrice as jest.Mock);
//         mockEvaluatePrice = EvaluatePriceMock; 

//         // Reset mock implementations for query chaining
//         mockQuery.where.mockReturnThis();
//         mockQuery.orderBy.mockReturnThis();
//         mockQuery.limit.mockReturnThis();
//         mockQuery.startAfter.mockReturnThis();
        
//         // Ensure mockCollection.doc is reset to its default implementation
//         mockCollection.doc.mockImplementation((id: string) => mockDocRef(id, {}));
//     });

//     // -----------------------------------
//     // Test: createOrder
//     // -----------------------------------
//     describe('createOrder', () => {

//         beforeEach(() => {
//             // Setup price service mock for a successful run
//             mockEvaluatePrice.mockResolvedValue({
//                 reference: { avgPrice: 90 },
//                 status: 'above_ref' as PriceStatus,
//                 diffPercent: 11.11,
//             });

//             // Setup Firestore mock for a successful add/get run
//             const newOrderId = 'new-order-456';
//             const addedData = { ...fakeOrderPayload, refAvgPrice: 90, priceStatus: 'above_ref', priceDiffPercent: 11.11, createdAt: Timestamp.now(), updatedAt: Timestamp.now(), status: 'open' };

//             // mockCollection.add returns a DocumentReference, which then needs .get()
//             const mockDocRefAfterAdd = { get: () => mockDocRef(newOrderId, addedData).get() };
//             mockCollection.add.mockResolvedValue(mockDocRefAfterAdd); 
//         });

//         test('should create an order successfully with price evaluation fields', async () => {
//             const result = await orderService.createOrder(fakeOrderPayload);

//             // Assertions
//             expect(mockEvaluatePrice).toHaveBeenCalledWith(
//                 fakeOrderPayload.province,
//                 fakeOrderPayload.grade,
//                 fakeOrderPayload.requestedPrice
//             );
//             expect(mockCollection.add).toHaveBeenCalledTimes(1);
//             expect(result).toEqual(expect.objectContaining({
//                 id: 'new-order-456',
//                 refAvgPrice: 90,
//                 priceStatus: 'above_ref',
//                 priceDiffPercent: 11.11,
//             }));
//         });

//         // FIX: แก้ไข Assertion โดยการส่ง expectedMessage ตรงไปที่ toThrow()
//         test.each([
//             ['ownerId', { ...fakeOrderPayload, ownerId: '' }, 'ownerId is required'],
//             ['type', { ...fakeOrderPayload, type: '' as OrderType }, 'type is required'],
//             ['grade', { ...fakeOrderPayload, grade: '' as any }, 'grade is required'],
//             ['province', { ...fakeOrderPayload, province: '' }, 'province is required'],
//             ['requestedPrice', { ...fakeOrderPayload, requestedPrice: '100' as any }, 'requestedPrice must be number'],
//         ])('should throw an error if %s is missing or invalid', async (field, payload, expectedMessage) => {
            
//             await expect(orderService.createOrder(payload)).rejects.toThrow(expectedMessage); // <--- FINAL FIX HERE
//         });
//     });

//     // -----------------------------------
//     // Test: listMyOrders
//     // -----------------------------------
//     describe('listMyOrders', () => {
//         const order1 = { id: 'o1', ownerId: fakeOwnerId, type: 'sell', status: 'open', createdAt: Timestamp.now() };
//         const order2 = { id: 'o2', ownerId: fakeOwnerId, type: 'sell', status: 'closed', createdAt: Timestamp.now() };
//         const order3 = { id: 'o3', ownerId: fakeOwnerId, type: 'buy', status: 'open', createdAt: Timestamp.now() };
//         const mockDocs = [
//             mockDocRef(order1.id, order1),
//             mockDocRef(order2.id, order2),
//             mockDocRef(order3.id, order3),
//         ];

//         beforeEach(() => {
//             // Set mockQuery.get for this test block's default query result
//             mockQuery.get.mockResolvedValue({ docs: mockDocs, length: mockDocs.length });
//         });

//         test('should throw an error if ownerId is missing', async () => {
//             await expect(orderService.listMyOrders({ ownerId: '' })).rejects.toThrow("ownerId is required");
//         });

//         test('should query orders by required ownerId and default to limit 20, desc order', async () => {
//             await orderService.listMyOrders({ ownerId: fakeOwnerId });

//             expect(mockQuery.where).toHaveBeenCalledWith("ownerId", "==", fakeOwnerId);
//             expect(mockQuery.orderBy).toHaveBeenCalledWith("createdAt", "desc");
//             expect(mockQuery.limit).toHaveBeenCalledWith(20);
//         });

//         test('should apply all optional filters (type, status, grade, province)', async () => {
//             const query = {
//                 ownerId: fakeOwnerId,
//                 type: 'buy' as OrderType,
//                 status: 'open' as OrderStatus,
//                 grade: 'B' as any,
//                 province: 'กรุงเทพฯ',
//             };
//             await orderService.listMyOrders(query);

//             expect(mockQuery.where).toHaveBeenCalledWith("type", "==", query.type);
//             expect(mockQuery.where).toHaveBeenCalledWith("status", "==", query.status);
//             expect(mockQuery.where).toHaveBeenCalledWith("grade", "==", query.grade);
//             expect(mockQuery.where).toHaveBeenCalledWith("province", "==", query.province);
//         });

//         test('should implement keyset pagination using startAfterId', async () => {
//             const startAfterId = 'o-cursor-id';
//             const cursorTs = Timestamp.now();
            
//             // Mock doc for cursor lookup (db.collection(COL).doc(id).get())
//             mockCollection.doc.mockImplementation((id: string) => {
//                 if (id === startAfterId) {
//                     return { get: jest.fn().mockResolvedValue({ exists: true, get: jest.fn(f => f === 'createdAt' ? cursorTs : undefined) }) };
//                 }
//                 return { get: jest.fn().mockResolvedValue({ exists: false }) };
//             });

//             await orderService.listMyOrders({ ownerId: fakeOwnerId, startAfterId });

//             expect(mockCollection.doc).toHaveBeenCalledWith(startAfterId);
//             expect(mockQuery.startAfter).toHaveBeenCalledWith(cursorTs);
//         });
        
//         test('should return items and the nextCursor', async () => {
//             const docsWithNext = [
//                 mockDocRef('o-first', { ...order1, id: 'o-first' }),
//                 mockDocRef('o-last', { ...order1, id: 'o-last' }),
//             ];
//             mockQuery.get.mockResolvedValue({ docs: docsWithNext, length: docsWithNext.length });
            
//             const result = await orderService.listMyOrders({ ownerId: fakeOwnerId, limit: 2 });
            
//             expect(result.items.length).toBe(2);
//             expect(result.nextCursor).toBe('o-last');
//         });
//     });

//     // -----------------------------------
//     // Test: findMatchesForOrder
//     // -----------------------------------
//     describe('findMatchesForOrder', () => {
//         const baseOrderData: Order = {
//             id: 'base-sell-order',
//             ownerId: 'base-user',
//             type: 'sell',
//             grade: 'A',
//             province: 'เชียงใหม่',
//             amphoe: 'เมือง',
//             requestedPrice: 100,
//             status: 'open',
//         };
//         const orderMatchAmphoe: Order = { ...baseOrderData, id: 'match-1', type: 'buy', ownerId: 'buyer-1', requestedPrice: 110 };
//         const orderMatchProvince: Order = { ...baseOrderData, id: 'match-2', type: 'buy', ownerId: 'buyer-2', amphoe: 'แม่ริม', requestedPrice: 105 };
        
//         // Mock base order retrieval
//         const mockBaseOrderDoc = mockDocRef(baseOrderData.id!, baseOrderData);

//         beforeEach(() => {
//             // Mock doc for base order lookup (db.collection(COL).doc(orderId).get())
//             mockCollection.doc.mockImplementation((id: string) => {
//                 if (id === baseOrderData.id) {
//                     return { get: jest.fn().mockResolvedValue(mockBaseOrderDoc.get()) };
//                 }
//                 return { get: jest.fn().mockResolvedValue({ exists: false }) };
//             });

//             // Clear the shared mockQuery.get before sequential mocks are set in each test
//             mockQuery.get.mockClear(); 
//             mockQuery.get.mockImplementation(jest.fn()); // Clear previous mockResolvedValue
//         });

//         test('should throw an error if the base order is not found', async () => {
//             // Mock doc for non-existent order
//             mockCollection.doc.mockImplementation((id: string) => ({
//                 get: jest.fn().mockResolvedValue({ exists: false }),
//             }));
//             await expect(orderService.findMatchesForOrder('non-existent-id')).rejects.toThrow("order_not_found");
//         });

//         test('should prioritize matches with the same amphoe', async () => {
//             // FIX: Use mockResolvedValueOnce to manage sequential queries (Q1 and Q2)
//             mockQuery.get.mockReset(); 
            
//             // Mock Query 1 (Same Amphoe) - 1 match
//             const q1Docs = [mockDocRef(orderMatchAmphoe.id!, orderMatchAmphoe)];
            
//             // Mock Query 2 (Same Province) - 1 match
//             const q2Docs = [mockDocRef(orderMatchProvince.id!, orderMatchProvince)];
            
//             mockQuery.get.mockResolvedValueOnce({ docs: q1Docs }) // Q1: Returns 1 match
//                          .mockResolvedValueOnce({ docs: q2Docs }); // Q2: Returns 1 match
            
//             const results = await orderService.findMatchesForOrder(baseOrderData.id!, { limit: 5 });

//             // Expected: 1 from Q1 + 1 from Q2 = 2
//             expect(results.length).toBe(2); 
//             expect(results[0].id).toBe(orderMatchAmphoe.id);
//             expect(results[0].priority).toBe('same_amphoe');
//             expect(results[1].id).toBe(orderMatchProvince.id);
//             expect(results[1].priority).toBe('same_province');
//         });

//         test('should correctly find same province matches when same amphoe limit is reached', async () => {
//             // FIX: Use mockResolvedValueOnce to manage sequential queries (Q1 and Q2)
//             mockQuery.get.mockReset();
            
//             const limit = 4;
//             const orderMatchAmphoe2: Order = { ...orderMatchAmphoe, id: 'match-1-2', ownerId: 'buyer-1-2' };
//             const orderMatchAmphoe3: Order = { ...orderMatchAmphoe, id: 'match-1-3', ownerId: 'buyer-1-3' };
            
//             // Mock Query 1 (Same Amphoe) - 3 matches
//             const q1Docs = [
//                 mockDocRef(orderMatchAmphoe.id!, orderMatchAmphoe),
//                 mockDocRef(orderMatchAmphoe2.id!, orderMatchAmphoe2),
//                 mockDocRef(orderMatchAmphoe3.id!, orderMatchAmphoe3),
//             ];
            
//             // Mock Query 2 (Same Province) - 3 potential matches (for limit * 2)
//             const orderMatchProvince2: Order = { ...orderMatchProvince, id: 'match-2-2', ownerId: 'buyer-2-2' };
//             const orderMatchProvince3: Order = { ...orderMatchProvince, id: 'match-2-3', ownerId: 'buyer-2-3' };
//             const q2Docs = [
//                 mockDocRef(orderMatchProvince.id!, orderMatchProvince),
//                 mockDocRef(orderMatchProvince2.id!, orderMatchProvince2),
//                 mockDocRef(orderMatchProvince3.id!, orderMatchProvince3),
//             ];
            
//             mockQuery.get.mockResolvedValueOnce({ docs: q1Docs }) // Q1: Returns 3 matches
//                          .mockResolvedValueOnce({ docs: q2Docs }); // Q2: Returns 3 matches (then code filters down to 1 more)

//             const results = await orderService.findMatchesForOrder(baseOrderData.id!, { limit });

//             // Expected: 3 from Q1 + 1 (after filtering) from Q2 = 4
//             expect(results.length).toBe(limit);
//             expect(results.filter(r => r.priority === 'same_amphoe').length).toBe(3);
//             expect(results.filter(r => r.priority === 'same_province').length).toBe(1);
//         });

//         test('should ensure matches do not include the base order or duplicates', async () => {
//             // FIX: Use mockResolvedValueOnce to manage sequential queries (Q1 and Q2)
//             mockQuery.get.mockReset();
            
//             // Mock Query 1 (Same Amphoe) - 1 match
//             const q1Docs = [mockDocRef(orderMatchAmphoe.id!, orderMatchAmphoe)];

//             // Mock Query 2 (Same Province) - 1 match that is the same as Q1, and 1 match that is the base order, and 1 new match
//             const orderMatchProvinceNew: Order = { ...orderMatchProvince, id: 'match-2-new', ownerId: 'buyer-2-new', amphoe: 'แม่ริม' };
//             const q2Docs = [
//                 mockDocRef(orderMatchAmphoe.id!, orderMatchAmphoe), // Duplicate from Q1
//                 mockDocRef(baseOrderData.id!, baseOrderData), // The base order itself
//                 mockDocRef(orderMatchProvinceNew.id!, orderMatchProvinceNew), // A valid new match
//             ];
            
//             mockQuery.get.mockResolvedValueOnce({ docs: q1Docs }) // Q1: Returns 1 match
//                          .mockResolvedValueOnce({ docs: q2Docs }); // Q2: Returns 3 docs (1 duplicate, 1 base, 1 new)
            
//             const results = await orderService.findMatchesForOrder(baseOrderData.id!, { limit: 5 });

//             // Expected: 1 from Q1 + 1 (new) from Q2 = 2
//             expect(results.length).toBe(2);
//             expect(results.map(r => r.id)).toEqual(expect.arrayContaining([orderMatchAmphoe.id, orderMatchProvinceNew.id]));
//             expect(results.map(r => r.id)).not.toContain(baseOrderData.id);
//         });

//     });
// });