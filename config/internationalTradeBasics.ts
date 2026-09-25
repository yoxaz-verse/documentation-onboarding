import type { CourseSubModule } from './courses';

const courseId = 'international-trade-basics';

export const INTERNATIONAL_TRADE_BASICS_LESSONS: CourseSubModule[] = [
  {
    id: 'international-trade-basics-1', courseId, order: 1,
    title: 'How International Trade Moves',
    description: 'Follow a transaction from the first inquiry through contracting, shipment, customs, delivery, and settlement.',
    content: [
      { type: 'section', heading: 'The trade lifecycle', paragraphs: ['International trade is a chain of connected commercial and operational decisions. A strong operator keeps the buyer, seller, goods, money, documents, and deadlines aligned from inquiry to final delivery.'], bullets: ['Inquiry and qualification: confirm product, specification, quantity, destination, timing, and buyer seriousness.', 'Quotation and negotiation: agree price, currency, Incoterm, payment terms, validity, and required documents.', 'Contract and preparation: issue the sales contract or purchase order, prepare the goods, book transport, and arrange insurance where required.', 'Shipment and clearance: create accurate transport and commercial documents, complete export formalities, move the goods, and complete import clearance.', 'Delivery and settlement: obtain delivery evidence, resolve discrepancies, collect any remaining payment, and retain records.'] },
      { type: 'section', heading: 'The parties and layers', paragraphs: ['The seller and buyer are the commercial principals. Carriers, freight forwarders, customs brokers, banks, insurers, inspection bodies, warehouses, ports, and regulators provide separate services. Their contracts do not automatically replace the obligations in the sales contract.'] },
      { type: 'callout', tone: 'key', title: 'Operator habit', text: 'Build one transaction checklist showing the owner, deadline, evidence, and fallback for every important action.' },
      { type: 'callout', tone: 'warning', title: 'Educational use', text: 'This course is practical training, not legal, customs, tax, banking, or insurance advice. Confirm transaction-specific requirements with qualified parties.' },
    ], passScore: 2,
    questions: [
      { id: 'q1', question: 'A buyer asks only for a product price. What should the operator clarify before treating it as a complete quotation request?', options: ['Specification, quantity, destination, timing, Incoterm, and payment expectations', 'Only the buyer’s preferred color', 'Only the seller’s company age'], correctAnswer: 'Specification, quantity, destination, timing, Incoterm, and payment expectations' },
      { id: 'q2', question: 'Who are the commercial principals in the sales transaction?', options: ['The buyer and seller', 'The carrier and insurer', 'The customs broker and bank'], correctAnswer: 'The buyer and seller' },
      { id: 'q3', question: 'What is the best way to coordinate the execution layers?', options: ['Assign an owner, deadline, evidence, and fallback to each action', 'Assume every service provider shares the same contract', 'Wait until the vessel departs before checking documents'], correctAnswer: 'Assign an owner, deadline, evidence, and fallback to each action' },
    ],
  },
  {
    id: 'international-trade-basics-2', courseId, order: 2,
    title: 'Incoterms® 2020 Fundamentals',
    description: 'Understand what an Incoterm clarifies, what it does not cover, and why the named place matters.',
    content: [
      { type: 'section', heading: 'What the rules do', paragraphs: ['The 11 Incoterms® 2020 rules are standard three-letter trade terms published by the International Chamber of Commerce. They divide delivery obligations, specified costs, and risk of loss or damage between seller and buyer.'], bullets: ['Seven rules work with any mode or combination of modes: EXW, FCA, CPT, CIP, DAP, DPU, and DDP.', 'Four rules are for sea and inland-waterway transport where delivery occurs alongside or on board a vessel: FAS, FOB, CFR, and CIF.', 'The named place, port, or point makes the selected rule operationally meaningful.'] },
      { type: 'section', heading: 'What the rules do not do', bullets: ['They do not set the price or payment timing.', 'They do not determine when ownership or title transfers.', 'They do not replace the sales contract or address every breach and remedy.', 'They do not guarantee product compliance or define the complete customs process.'] },
      { type: 'callout', tone: 'example', title: 'Correct structure', text: 'Write the rule, the precise named place or port, and the version—for example: “FCA Seller Warehouse, Pune, India, Incoterms® 2020.”' },
      { type: 'callout', tone: 'warning', title: 'Risk is not ownership', text: 'The point where transit risk transfers is not automatically the point where legal title or payment transfers.' },
    ], passScore: 2,
    questions: [
      { id: 'q1', question: 'A contract says only “CIF” with no port or rules version. What is missing?', options: ['A precise named port and “Incoterms® 2020”', 'The seller’s logo size', 'The buyer’s bank password'], correctAnswer: 'A precise named port and “Incoterms® 2020”' },
      { id: 'q2', question: 'Which set contains only rules usable for any mode of transport?', options: ['FCA, CPT, CIP, DAP', 'FAS, FOB, CFR, CIF', 'FOB, FCA, CIF, DPU'], correctAnswer: 'FCA, CPT, CIP, DAP' },
      { id: 'q3', question: 'What do Incoterms® rules determine about ownership of goods?', options: ['They do not determine ownership transfer', 'Ownership always transfers at shipment', 'Ownership always transfers after customs clearance'], correctAnswer: 'They do not determine ownership transfer' },
    ],
  },
  {
    id: 'international-trade-basics-3', courseId, order: 3,
    title: 'EXW and FCA',
    description: 'Compare two origin-focused rules and understand why FCA is often more workable for export shipments.',
    content: [
      { type: 'section', heading: 'EXW — Ex Works', paragraphs: ['Under EXW, the seller places the goods at the buyer’s disposal at the named place, typically without loading them on the collecting vehicle. The buyer carries extensive transport and clearance responsibility.'], bullets: ['Seller prepares and identifies the goods.', 'Buyer normally arranges loading, export formalities, carriage, import clearance, and delivery.', 'EXW can be difficult when the buyer cannot legally or practically complete export clearance in the seller’s country.'] },
      { type: 'section', heading: 'FCA — Free Carrier', paragraphs: ['Under FCA, the seller delivers the goods to the buyer’s nominated carrier or person at the named place and completes export clearance. The exact delivery mechanics depend on whether the named place is the seller’s premises or another location.'], bullets: ['At the seller’s premises, delivery occurs when the goods are loaded on the buyer’s collecting transport.', 'At another named place, delivery occurs when the goods arrive on the seller’s transport ready for unloading and are placed at the carrier’s disposal.', 'FCA can be used for containers and multimodal shipments.'] },
      { type: 'callout', tone: 'example', title: 'Scenario', text: 'If the seller must load a container at its factory and clear it for export, FCA Seller Factory, [precise address], Incoterms® 2020 is generally a clearer starting point than EXW.' },
    ], passScore: 2,
    questions: [
      { id: 'q1', question: 'The seller must load at its factory and complete export clearance. Which rule better matches that allocation?', options: ['FCA at the seller’s premises', 'EXW', 'DDP at the buyer’s warehouse'], correctAnswer: 'FCA at the seller’s premises' },
      { id: 'q2', question: 'Why can EXW create export difficulty?', options: ['The foreign buyer may be unable to complete export formalities in the seller’s country', 'EXW requires the seller to buy maximum insurance', 'EXW is restricted to sea transport'], correctAnswer: 'The foreign buyer may be unable to complete export formalities in the seller’s country' },
      { id: 'q3', question: 'Can FCA be used for a container moving by truck and sea?', options: ['Yes, FCA is an any-mode rule', 'No, FCA is only for air freight', 'No, only FOB may be used for containers'], correctAnswer: 'Yes, FCA is an any-mode rule' },
    ],
  },
  {
    id: 'international-trade-basics-4', courseId, order: 4,
    title: 'FAS and FOB',
    description: 'Learn the two origin-focused rules reserved for sea and inland-waterway transport.',
    content: [
      { type: 'section', heading: 'FAS — Free Alongside Ship', paragraphs: ['The seller delivers when the goods are placed alongside the buyer-nominated vessel at the named port of shipment. From that delivery point, the buyer bears risk and normally arranges the main carriage.'] },
      { type: 'section', heading: 'FOB — Free On Board', paragraphs: ['The seller delivers when the goods are placed on board the buyer-nominated vessel at the named port of shipment. The seller clears the goods for export; risk transfers when the goods are on board.'] },
      { type: 'section', heading: 'Use the transport fit', bullets: ['FAS and FOB are intended for sea or inland-waterway shipments involving vessel-side or on-board delivery.', 'For containerized or multimodal movements delivered to a terminal before vessel loading, consider an any-mode rule such as FCA.', 'Name the shipment port precisely and confirm terminal practices, cut-off times, loading responsibility, and evidence of delivery.'] },
      { type: 'callout', tone: 'warning', title: 'Avoid the automatic “FOB” habit', text: 'Choose the rule from the real delivery method and control of the cargo, not simply because the shipment includes an ocean leg.' },
    ], passScore: 2,
    questions: [
      { id: 'q1', question: 'Bulk cargo is delivered beside the nominated vessel. Which rule describes that delivery point?', options: ['FAS', 'FOB', 'CIP'], correctAnswer: 'FAS' },
      { id: 'q2', question: 'Under FOB, when does delivery and risk transfer occur?', options: ['When the goods are on board the vessel at the named shipment port', 'When the buyer resells the goods', 'When import duty is paid'], correctAnswer: 'When the goods are on board the vessel at the named shipment port' },
      { id: 'q3', question: 'A sealed container is handed to a carrier at an inland terminal before loading. Which rule is often the better starting point?', options: ['FCA', 'FAS', 'CIF without a named port'], correctAnswer: 'FCA' },
    ],
  },
  {
    id: 'international-trade-basics-5', courseId, order: 5,
    title: 'CPT, CIP, CFR, and CIF',
    description: 'Separate the seller’s obligation to pay carriage from the earlier point where transit risk can transfer.',
    content: [
      { type: 'section', heading: 'The central C-rule distinction', paragraphs: ['With the C rules, the seller contracts and pays for carriage to the named destination, but delivery and risk transfer occur earlier at origin. Cost destination and risk-transfer point are therefore not the same.'] },
      { type: 'section', heading: 'Any-mode rules', bullets: ['CPT — Carriage Paid To: seller pays carriage to the named destination; risk transfers when the goods are delivered to the carrier at the agreed delivery point.', 'CIP — Carriage and Insurance Paid To: follows the CPT structure and also requires the seller to arrange the insurance cover required by the rule.'] },
      { type: 'section', heading: 'Sea and inland-waterway rules', bullets: ['CFR — Cost and Freight: seller pays freight to the named destination port; risk transfers when the goods are on board at the shipment port.', 'CIF — Cost Insurance and Freight: follows the CFR structure and also requires the seller to arrange the insurance cover required by the rule.'] },
      { type: 'callout', tone: 'example', title: 'Do not confuse cost with risk', text: 'Under CIF Named Destination Port, the seller pays freight to that destination and arranges required insurance, while transit risk transfers when the goods are on board at origin.' },
    ], passScore: 2,
    questions: [
      { id: 'q1', question: 'The seller pays carriage to destination under CPT. Does that necessarily keep transit risk with the seller until arrival?', options: ['No, risk transfers at the contractual delivery point at origin', 'Yes, payment of freight always controls risk', 'Yes, but only when no invoice exists'], correctAnswer: 'No, risk transfers at the contractual delivery point at origin' },
      { id: 'q2', question: 'Which pair requires the seller to arrange insurance under the rule?', options: ['CIP and CIF', 'CPT and CFR', 'EXW and FCA'], correctAnswer: 'CIP and CIF' },
      { id: 'q3', question: 'Which pair is reserved for sea and inland-waterway transport?', options: ['CFR and CIF', 'CPT and CIP', 'FCA and DAP'], correctAnswer: 'CFR and CIF' },
    ],
  },
  {
    id: 'international-trade-basics-6', courseId, order: 6,
    title: 'DAP, DPU, and DDP',
    description: 'Compare destination delivery rules and allocate unloading and import-clearance responsibility correctly.',
    content: [
      { type: 'section', heading: 'Destination rules', bullets: ['DAP — Delivered at Place: seller delivers at the named destination on the arriving means of transport, ready for unloading. Buyer unloads and handles import clearance.', 'DPU — Delivered at Place Unloaded: seller delivers after unloading at the named destination. It is the only Incoterms® 2020 rule requiring the seller to unload at destination.', 'DDP — Delivered Duty Paid: seller delivers ready for unloading and carries import-clearance, duty, and applicable tax responsibilities under the rule.'] },
      { type: 'section', heading: 'Check feasibility before promising', paragraphs: ['Destination rules place substantial planning and cost responsibility on the seller. DDP is especially demanding because a foreign seller may not be able to act as importer of record, obtain registrations, or recover taxes in the destination country.'] },
      { type: 'callout', tone: 'warning', title: 'Never quote DDP casually', text: 'Confirm importer-of-record rules, licenses, product compliance, duty, taxes, broker authority, and local registration before accepting DDP.' },
      { type: 'callout', tone: 'example', title: 'Unloading test', text: 'Choose DPU only when the seller can control and price unloading at the precisely named destination. Under DAP or DDP, delivery is ready for unloading.' },
    ], passScore: 2,
    questions: [
      { id: 'q1', question: 'The seller must deliver and unload at the buyer’s named warehouse. Which rule matches?', options: ['DPU', 'DAP', 'EXW'], correctAnswer: 'DPU' },
      { id: 'q2', question: 'Under DAP, who normally performs import clearance?', options: ['The buyer', 'The seller', 'The ocean carrier automatically'], correctAnswer: 'The buyer' },
      { id: 'q3', question: 'What must be checked before agreeing to DDP?', options: ['Whether the seller can legally and practically handle import obligations, duty, and taxes', 'Only whether the carton has a logo', 'Only whether the buyer has a forklift'], correctAnswer: 'Whether the seller can legally and practically handle import obligations, duty, and taxes' },
    ],
  },
  {
    id: 'international-trade-basics-7', courseId, order: 7,
    title: 'Selecting and Writing the Right Incoterm',
    description: 'Use a repeatable decision process and document the exact rule, place, point, and version.',
    content: [
      { type: 'section', heading: 'A practical selection sequence', bullets: ['Map the actual transport: mode, containerization, handover point, main carrier, and final destination.', 'Decide who can perform export and import formalities.', 'Decide who contracts and pays for main carriage and any required insurance.', 'Identify the physical point where delivery and risk should transfer.', 'Confirm loading or unloading responsibility and the parties’ operational capability.', 'Price the selected responsibilities and write the exact rule into the quotation and contract.'] },
      { type: 'section', heading: 'Make the named point precise', paragraphs: ['A city alone may hide multiple terminals, depots, gates, or warehouses. State the address, terminal, port, berth, or other agreed point as precisely as the transaction requires. Use the same wording across the quotation, purchase order, invoice, shipping instructions, and contract.'] },
      { type: 'callout', tone: 'example', title: 'Complete wording', text: '“CIP Buyer Distribution Centre, Gate 2, Bengaluru, India, Incoterms® 2020” is more actionable than “CIP India.”' },
      { type: 'callout', tone: 'warning', title: 'Do not choose from price alone', text: 'The lowest-looking quote may exclude carriage, clearance, unloading, duty, tax, or insurance that another quote includes.' },
    ], passScore: 2,
    questions: [
      { id: 'q1', question: 'Two quotations use different Incoterms. What is the correct comparison?', options: ['Normalize included costs, responsibilities, risk points, and named places', 'Compare only the headline unit price', 'Choose whichever uses the shortest abbreviation'], correctAnswer: 'Normalize included costs, responsibilities, risk points, and named places' },
      { id: 'q2', question: 'Which wording is operationally strongest?', options: ['DAP Buyer Warehouse, Dock 3, Dubai, UAE, Incoterms® 2020', 'DAP UAE', 'Delivered somewhere'], correctAnswer: 'DAP Buyer Warehouse, Dock 3, Dubai, UAE, Incoterms® 2020' },
      { id: 'q3', question: 'When should the operator confirm import-clearance capability?', options: ['Before agreeing the Incoterm and price', 'After the goods reach customs', 'Only after final payment'], correctAnswer: 'Before agreeing the Incoterm and price' },
    ],
  },
  {
    id: 'international-trade-basics-8', courseId, order: 8,
    title: 'Payment Terms and Commercial Risk',
    description: 'Compare common payment structures and record precise triggers, dates, currencies, and evidence.',
    content: [
      { type: 'section', heading: 'Common structures', bullets: ['Advance payment: buyer pays all or part before production or shipment, reducing seller credit risk while increasing buyer performance risk.', 'Open account: seller ships before payment is due, supporting the buyer’s cash flow but increasing seller credit and collection risk.', 'Cash against documents: commercial or transport documents are released against payment under the agreed process; wording and bank handling must be explicit.', 'Milestone payments: portions become due at defined events such as order confirmation, inspection, shipment, delivery, or commissioning.'] },
      { type: 'section', heading: 'Write measurable terms', paragraphs: ['State currency, amount or percentage, due date or trigger, permitted banking method, bank charges, document conditions, late-payment consequences, and refund or remedy rules. Avoid vague phrases such as “balance later.”'] },
      { type: 'section', heading: 'Assess the whole risk', bullets: ['Buyer and seller creditworthiness and transaction history.', 'Country, currency, transfer, fraud, and sanctions exposure.', 'Production lead time, custom-made goods, dispute process, and ability to recover or resell.', 'How the payment trigger connects to documents and operational evidence.'] },
      { type: 'callout', tone: 'warning', title: 'Separate payment from Incoterms', text: 'An Incoterm allocates delivery obligations, specified costs, and risk. It does not say when the buyer must pay.' },
    ], passScore: 2,
    questions: [
      { id: 'q1', question: 'A contract says “30% advance, 70% later.” What should be improved?', options: ['Define the exact trigger, due date, currency, method, charges, and required evidence for the balance', 'Replace the currency with a product photo', 'Remove all payment dates'], correctAnswer: 'Define the exact trigger, due date, currency, method, charges, and required evidence for the balance' },
      { id: 'q2', question: 'Which structure generally creates more seller credit exposure?', options: ['Open account', 'Full payment in advance', 'A fully paid order'], correctAnswer: 'Open account' },
      { id: 'q3', question: 'Does choosing FOB determine when payment is due?', options: ['No, payment terms must be agreed separately', 'Yes, payment is always due at vessel loading', 'Yes, payment is always due after import clearance'], correctAnswer: 'No, payment terms must be agreed separately' },
    ],
  },
  {
    id: 'international-trade-basics-9', courseId, order: 9,
    title: 'Collections, Letters of Credit, and Documents',
    description: 'Understand bank-handled payment mechanisms and why document accuracy controls outcomes.',
    content: [
      { type: 'section', heading: 'Documentary collection', paragraphs: ['In a documentary collection, banks handle documents under collection instructions but do not normally provide a bank payment undertaking. Documents may be released against payment or against acceptance of a time draft, depending on the agreed structure.'] },
      { type: 'section', heading: 'Letter of credit', paragraphs: ['A documentary letter of credit is a conditional undertaking by the issuing bank to honor a complying presentation. Banks examine documents rather than physically inspecting the goods. The exact credit terms, applicable rules, dates, and document requirements control.'] },
      { type: 'section', heading: 'Document-control workflow', bullets: ['Review the payment instrument before shipment and request workable amendments early.', 'Create a document matrix listing issuer, required wording, originals or copies, dates, data source, and deadline.', 'Check consistency across invoice, packing list, transport document, certificate of origin, insurance document, inspection certificate, and any product-specific records.', 'Use a second-person review and submit within the required presentation period.'] },
      { type: 'callout', tone: 'warning', title: 'Banks deal with documents', text: 'Correct goods do not cure a non-complying presentation. A discrepancy can delay or prevent payment even when the shipment itself is satisfactory.' },
    ], passScore: 2,
    questions: [
      { id: 'q1', question: 'Under a letter of credit, what does the bank primarily examine?', options: ['The presented documents against the credit terms', 'The physical quality of every item', 'The buyer’s warehouse layout'], correctAnswer: 'The presented documents against the credit terms' },
      { id: 'q2', question: 'Does a documentary collection normally create a bank guarantee of payment?', options: ['No, banks generally handle documents under instructions without guaranteeing payment', 'Yes, every collection is a bank guarantee', 'Yes, but only for open-account sales'], correctAnswer: 'No, banks generally handle documents under instructions without guaranteeing payment' },
      { id: 'q3', question: 'The letter of credit requires an impossible shipment date. What should the operator do?', options: ['Request an amendment before shipment', 'Ship late and ignore the discrepancy', 'Change the document after presentation without authorization'], correctAnswer: 'Request an amendment before shipment' },
    ],
  },
  {
    id: 'international-trade-basics-10', courseId, order: 10,
    title: 'Executing the Trade End to End',
    description: 'Combine commercial, logistics, document, customs, insurance, compliance, and delivery controls into one final workflow.',
    content: [
      { type: 'section', heading: 'Before confirming the order', bullets: ['Verify the parties, authority, product specification, quantity, quality standard, price, currency, Incoterm wording, payment terms, timeline, and dispute path.', 'Check product restrictions, sanctions exposure, licenses, labeling, testing, certificates, export controls, and destination import requirements.', 'Confirm transport feasibility, packaging, dangerous-goods status, insurance need, customs valuation inputs, and landed-cost assumptions.'] },
      { type: 'section', heading: 'Before shipment', bullets: ['Match the purchase order, sales contract, pro forma invoice, and payment instrument.', 'Book the correct equipment and route; confirm cut-offs, loading, weights, marks, and handover evidence.', 'Prepare a document matrix and validate names, addresses, descriptions, quantities, values, dates, references, and signatures.', 'Record exceptions and obtain written approval for material changes.'] },
      { type: 'section', heading: 'During transit and at delivery', bullets: ['Track milestones and communicate delays with impact and recovery actions.', 'Maintain the claim file if loss, damage, shortage, or delay occurs; notify the correct parties within required time limits.', 'Coordinate import clearance and final delivery, obtain proof, reconcile charges and quantities, and close remaining payment and claims.'] },
      { type: 'callout', tone: 'key', title: 'Final operator rule', text: 'Never assume one document or service provider covers the whole transaction. Reconcile the sales contract, Incoterm, payment mechanism, logistics plan, compliance duties, and evidence at every milestone.' },
      { type: 'callout', tone: 'warning', title: 'Escalate uncertainty', text: 'Use qualified legal, customs, tax, banking, compliance, and insurance specialists whenever the transaction or jurisdiction requires expert advice.' },
    ], passScore: 2,
    questions: [
      { id: 'q1', question: 'The invoice, packing list, and transport instructions describe the goods differently. What should happen before shipment?', options: ['Reconcile the data and obtain any required written correction or approval', 'Ship and let customs choose a description', 'Delete the packing list'], correctAnswer: 'Reconcile the data and obtain any required written correction or approval' },
      { id: 'q2', question: 'Cargo arrives damaged. What is the strongest immediate response?', options: ['Preserve evidence, issue required notices, follow the claim process, and coordinate mitigation', 'Discard the packaging and wait', 'Assume the Incoterm automatically pays the claim'], correctAnswer: 'Preserve evidence, issue required notices, follow the claim process, and coordinate mitigation' },
      { id: 'q3', question: 'What makes an order ready for execution?', options: ['Aligned commercial terms, responsibilities, payment, documents, logistics, compliance, owners, and deadlines', 'A unit price alone', 'A verbal promise without named places or dates'], correctAnswer: 'Aligned commercial terms, responsibilities, payment, documents, logistics, compliance, owners, and deadlines' },
    ],
  },
];
