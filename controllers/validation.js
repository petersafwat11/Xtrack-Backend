// Table: inventory_detail
// Columns:
//   - company (character varying, max length: 20) NOT NULL      
//   - entity_code (character varying, max length: 20) NOT NULL  
//   - warehouse_code (character varying, max length: 20) NOT NULL
//   - order_ref (character varying, max length: 20) NOT NULL    
//   - row_ref (character varying, max length: 20) NOT NULL      
//   - choose_sel (character, max length: 1) NOT NULL
//   - sku_category (character varying, max length: 20) NOT NULL 
//   - location_code (character varying, max length: 20) NOT NULL
//   - sku_code (character varying, max length: 30) NOT NULL     
//   - sku_desc (character varying, max length: 100) NOT NULL    
//   - sku_uom (character, max length: 3) NOT NULL
//   - sku_qty (numeric) NOT NULL
//   - sku_weight (numeric) NOT NULL
//   - sku_cbm (numeric) NOT NULL
//   - container_no (character varying, max length: 20) NULL     
//   - pallet_no (character varying, max length: 20) NULL        
//   - carton_no (character varying, max length: 20) NULL        
//   - mfg_date (date) NULL
//   - expiry_date (date) NULL
//   - reference1 (character varying, max length: 20) NULL       
//   - reference2 (character varying, max length: 20) NULL       
//   - reference3 (character varying, max length: 20) NULL       
//   - reference4 (character varying, max length: 20) NULL       
//   - damage_status (character, max length: 1) NOT NULL
//   - damage_code (character varying, max length: 10) NULL      
//   - item_comments (character varying, max length: 100) NULL   
//   - post_status (character, max length: 1) NOT NULL
//   - post_date (date) NULL
//   - post_time (time without time zone) NULL
//   - post_user (character varying, max length: 10) NULL        
//   - post_ref (character varying, max length: 20) NULL
//   - batch_no (character varying, max length: 20) NULL
//   - actual_date (date) NOT NULL
//   - put_ref (character varying, max length: 20) NULL
//   - put_done (character, max length: 1) NOT NULL
//   - pick_ref (character varying, max length: 20) NULL
//   - pick_done (character, max length: 1) NOT NULL
//   - block_status (character, max length: 1) NULL
//   - block_date (date) NULL
//   - block_user (character varying, max length: 10) NULL       
//   - used_in_release (character, max length: 1) NULL
//   - create_user (character varying, max length: 10) NOT NULL  
//   - create_date (date) NOT NULL
//   - create_time (time without time zone) NOT NULL
//   - update_user (character varying, max length: 10) NOT NULL  
//   - update_date (date) NOT NULL
//   - update_time (time without time zone) NOT NULL
//   - itemsign (integer) NOT NULL

// Table: inventory_header
// Columns:
//   - company (character varying, max length: 20) NOT NULL      
//   - entity_code (character varying, max length: 20) NOT NULL  
//   - partner_code (character varying, max length: 20) NOT NULL 
//   - commodity (character varying, max length: 30) NOT NULL    
//   - order_ref (character varying, max length: 20) NOT NULL    
//   - order_date (date) NOT NULL
//   - order_desc (character varying, max length: 100) NULL      
//   - order_type (character, max length: 1) NOT NULL
//   - order_mode (character, max length: 1) NOT NULL
//   - goods_type (character, max length: 1) NOT NULL
//   - order_status (character, max length: 2) NOT NULL
//   - status_date (date) NOT NULL
//   - po_number (character varying, max length: 50) NULL        
//   - invoice_no (character varying, max length: 30) NULL       
//   - master_ref (character varying, max length: 20) NULL       
//   - booking_ref (character varying, max length: 20) NULL      
//   - create_user (character varying, max length: 10) NOT NULL  
//   - create_date (date) NOT NULL
//   - create_time (timestamp with time zone) NOT NULL
//   - update_user (character varying, max length: 10) NOT NULL  
//   - update_date (date) NOT NULL
//   - update_time (timestamp with time zone) NOT NULL
//   - partner_name (character varying, max length: 100) NULL    
//   - tracking_ref (character varying, max length: 20) NULL     

// Table: partner
// Columns:
//   - partner_code (character varying, max length: 20) NOT NULL 
//   - partner_active (character, max length: 1) NOT NULL        
//   - partner_ref (character varying, max length: 50) NOT NULL  
//   - partner_name (character varying, max length: 150) NOT NULL
//   - partner_address1 (character varying, max length: 100) NOT NULL
//   - partner_address2 (character varying, max length: 100) NULL
//   - partner_address3 (character varying, max length: 100) NULL
//   - partner_city (character varying, max length: 20) NULL     
//   - partner_state (character varying, max length: 20) NULL    
//   - partner_country (character varying, max length: 100) NULL 
//   - partner_country_iso (character, max length: 3) NULL       
//   - partner_postcode (character varying, max length: 10) NULL 
//   - partner_tel_1 (character varying, max length: 30) NULL    
//   - partner_tel_2 (character varying, max length: 30) NULL    
//   - partner_tel_3 (character varying, max length: 30) NULL    
//   - partner_fax_1 (character varying, max length: 30) NULL    
//   - partner_telex (character varying, max length: 30) NULL    
//   - partner_contact_1 (character varying, max length: 50) NULL
//   - partner_contact_2 (character varying, max length: 50) NULL
//   - partner_sales_person (character varying, max length: 10) NOT NULL
//   - partner_cs_person (character varying, max length: 10) NULL
//   - partner_email_1 (character varying, max length: 50) NULL  
//   - partner_website (character varying, max length: 50) NULL  
//   - partner_gst_reg (character varying, max length: 30) NULL  
//   - create_user (character varying, max length: 10) NOT NULL  
//   - create_date (date) NOT NULL
//   - update_user (character varying, max length: 10) NOT NULL  
//   - update_date (date) NOT NULL
//   - partner_group (character, max length: 1) NULL
//   - partner_terms (character varying, max length: 20) NULL    
//   - partner_currency (character, max length: 3) NULL
//   - sales_type (character, max length: 1) NULL
//   - partner_name_zh (character varying, max length: 100) NULL 
//   - partner_address_zh (character varying, max length: 500) NULL
//   - khmer_name (character varying, max length: 100) NULL      
//   - khmer_address (character varying, max length: 300) NULL   
//   - partner_crno (character varying, max length: 20) NULL     
//   - partner_name_khmer (character varying, max length: 100) NULL
//   - partner_address_khmer (character varying, max length: 500) NULL
//   - partner_name_vn (character varying, max length: 100) NULL 
//   - partner_address_vn (character varying, max length: 500) NULL
//   - partner_name_th (character varying, max length: 100) NULL 
//   - partner_address_th (character varying, max length: 500) NULL
//   - partner_name_mm (character varying, max length: 100) NULL 
//   - partner_address_mm (character varying, max length: 500) NULL
//   - partner_name_tw (character varying, max length: 100) NULL 
//   - partner_address_tw (character varying, max length: 500) NULL
//   - partner_iso_code (character varying, max length: 20) NULL 
//   - partner_iata_code (character varying, max length: 20) NULL
//   - partner_iata_account (character varying, max length: 20) NULL
//   - partner_scac_code (character varying, max length: 20) NULL
//   - partner_whatsapp (character varying, max length: 20) NULL 
//   - partner_wechat (character varying, max length: 20) NULL   
//   - partner_facebook (character varying, max length: 200) NULL
//   - partner_line_id (character varying, max length: 20) NULL  
//   - partner_instagram (character varying, max length: 100) NULL
//   - partner_class (character, max length: 1) NOT NULL
//   - wca_no (character varying, max length: 20) NULL
//   - lognet_no (character varying, max length: 20) NULL        
//   - gaa_no (character varying, max length: 20) NULL
//   - egln_no (character varying, max length: 20) NULL
//   - partner_uen (character varying, max length: 20) NULL      
//   - partner_iec_code (character varying, max length: 20) NULL 
//   - partner_usci_code (character varying, max length: 20) NULL
//   - partner_raca_code (character varying, max length: 20) NULL
//   - iec_code (character varying, max length: 20) NULL
//   - usci_code (character varying, max length: 20) NULL        
//   - raca_code (character varying, max length: 20) NULL        
//   - partner_status (character, max length: 1) NOT NULL        
//   - partner_network (character varying, max length: 200) NULL 
//   - partner_category (character, max length: 3) NULL
//   - partner_logo (character varying, max length: 200) NULL    
//   - company (character varying, max length: 20) NOT NULL      
//   - entity_code (character varying, max length: 20) NOT NULL  
//   - partner_type (character, max length: 1) NOT NULL
//   - partner_roles (character varying, max length: 200) NULL   
//   - partner_term (smallint) NOT NULL
//   - choose_sel (character, max length: 1) NOT NULL
//   - partner_source (character varying, max length: 30) NOT NULL
//   - peppol_id (character varying, max length: 30) NULL        
//   - api_user (character varying, max length: 20) NULL
//   - api_password (character varying, max length: 20) NULL     
//   - api_key (character varying, max length: 100) NULL
//   - partner_label_file (character varying, max length: 300) NULL
//   - role_wms (character, max length: 1) NOT NULL
//   - role_lastmile (character, max length: 1) NOT NULL
//   - role_contractor (character, max length: 1) NOT NULL       

// Table: warehouse_master
// Columns:
//   - company (character varying, max length: 20) NOT NULL      
//   - entity_code (character varying, max length: 20) NOT NULL  
//   - warehouse_order (integer) NULL
//   - warehouse_code (character varying, max length: 20) NOT NULL
//   - warehouse_name (character varying, max length: 100) NOT NULL
//   - warehouse_address (character varying, max length: 300) NOT NULL
//   - warehouse_country (character varying, max length: 50) NULL
//   - warehouse_postcode (character varying, max length: 10) NULL
//   - warehouse_telephone (character varying, max length: 20) NULL
//   - warehouse_contact (character varying, max length: 50) NULL
//   - warehouse_email (character varying, max length: 200) NULL 
//   - warehouse_active (character, max length: 1) NOT NULL      
//   - create_user (character varying, max length: 10) NOT NULL  
//   - create_date (date) NOT NULL
//   - create_time (time without time zone) NOT NULL
//   - update_user (character varying, max length: 10) NOT NULL  
//   - update_date (date) NOT NULL
//   - update_time (time without time zone) NOT NULL

// Table: wms_app_pack
// Columns:
//   - company (character varying, max length: 20) NOT NULL      
//   - entity_code (character varying, max length: 20) NOT NULL  
//   - pack_id (bigint) NOT NULL
//   - warehouse_code (character varying, max length: 20) NOT NULL
//   - order_ref (character varying, max length: 20) NOT NULL    
//   - pack_location (character varying, max length: 20) NOT NULL
//   - source_type (character, max length: 1) NOT NULL
//   - source_value (character varying, max length: 30) NOT NULL 
//   - target_type (character, max length: 1) NOT NULL
//   - target_value (character varying, max length: 30) NOT NULL 
//   - sku_code (character varying, max length: 30) NOT NULL     
//   - sku_desc (character varying, max length: 100) NOT NULL    
//   - sku_qty (smallint) NOT NULL
//   - reference1 (character varying, max length: 20) NULL       
//   - create_date (date) NOT NULL
//   - create_user (character varying, max length: 10) NOT NULL  
//   - choose_sel (character, max length: 1) NOT NULL
//   - post_status (character, max length: 1) NOT NULL
//   - image_link1 (character varying, max length: 300) NULL     
//   - image_link2 (character varying, max length: 300) NULL     
//   - image_link3 (character varying, max length: 300) NULL     

// Table: wms_app_pick
// Columns:
//   - company (character varying, max length: 20) NOT NULL      
//   - entity_code (character varying, max length: 20) NOT NULL  
//   - pick_id (bigint) NOT NULL
//   - warehouse_code (character varying, max length: 20) NOT NULL
//   - order_ref (character varying, max length: 20) NOT NULL    
//   - pick_ref (character varying, max length: 20) NOT NULL     
//   - pick_location (character varying, max length: 20) NOT NULL
//   - sku_code (character varying, max length: 30) NOT NULL     
//   - sku_desc (character varying, max length: 100) NOT NULL    
//   - sku_qty (smallint) NOT NULL
//   - reference1 (character varying, max length: 20) NULL       
//   - create_date (date) NOT NULL
//   - create_user (character varying, max length: 10) NOT NULL  
//   - choose_sel (character, max length: 1) NOT NULL
//   - post_status (character, max length: 1) NOT NULL
//   - image_link1 (character varying, max length: 300) NULL     
//   - image_link2 (character varying, max length: 300) NULL     
//   - image_link3 (character varying, max length: 300) NULL     

// Table: wms_app_putaway
// Columns:
//   - company (character varying, max length: 20) NOT NULL      
//   - entity_code (character varying, max length: 20) NOT NULL  
//   - put_id (bigint) NOT NULL
//   - warehouse_code (character varying, max length: 20) NOT NULL
//   - order_ref (character varying, max length: 20) NOT NULL    
//   - from_location (character varying, max length: 20) NOT NULL
//   - source_type (character, max length: 1) NOT NULL
//   - source_value (character varying, max length: 30) NOT NULL 
//   - to_location (character varying, max length: 20) NOT NULL  
//   - target_type (character, max length: 1) NOT NULL
//   - target_value (character varying, max length: 30) NOT NULL 
//   - sku_code (character varying, max length: 30) NOT NULL     
//   - sku_qty (smallint) NOT NULL
//   - reference1 (character varying, max length: 20) NULL       
//   - create_date (date) NOT NULL
//   - create_user (character varying, max length: 10) NOT NULL  
//   - choose_sel (character, max length: 1) NOT NULL
//   - post_status (character, max length: 1) NOT NULL
//   - image_link1 (character varying, max length: 300) NULL     
//   - image_link2 (character varying, max length: 300) NULL     
//   - image_link3 (character varying, max length: 300) NULL     

// Table: wms_app_receive
// Columns:
//   - company (character varying, max length: 20) NOT NULL      
//   - entity_code (character varying, max length: 20) NOT NULL  
//   - rec_id (bigint) NOT NULL
//   - warehouse_code (character varying, max length: 20) NOT NULL
//   - commodity (character varying, max length: 30) NOT NULL    
//   - order_ref (character varying, max length: 20) NOT NULL    
//   - container_no (character varying, max length: 20) NULL     
//   - pallet_no (character varying, max length: 20) NULL        
//   - carton_no (character varying, max length: 20) NULL        
//   - sku_code (character varying, max length: 30) NOT NULL     
//   - sku_qty (smallint) NOT NULL
//   - sku_uom (character, max length: 3) NOT NULL
//   - reference1 (character varying, max length: 20) NULL       
//   - image_link1 (character varying, max length: 300) NULL     
//   - image_link2 (character varying, max length: 300) NULL     
//   - image_link3 (character varying, max length: 300) NULL     
//   - create_date (date) NOT NULL
//   - create_user (character varying, max length: 10) NOT NULL  
//   - choose_sel (character, max length: 1) NOT NULL
//   - post_status (character, max length: 1) NOT NULL
//   - sku_desc (character varying, max length: 100) NOT NULL    

// Table: wms_app_sorting
// Columns:
//   - company (character varying, max length: 20) NOT NULL      
//   - entity_code (character varying, max length: 20) NOT NULL  
//   - sort_id (bigint) NOT NULL
//   - warehouse_code (character varying, max length: 20) NOT NULL
//   - commodity (character varying, max length: 30) NOT NULL    
//   - order_ref (character varying, max length: 20) NOT NULL    
//   - sort_type (character, max length: 1) NOT NULL
//   - sku_code (character varying, max length: 30) NOT NULL     
//   - sku_qty (smallint) NOT NULL
//   - reference1 (character varying, max length: 20) NULL       
//   - image_link1 (character varying, max length: 300) NULL     
//   - image_link2 (character varying, max length: 300) NULL     
//   - image_link3 (character varying, max length: 300) NULL     
//   - create_date (date) NOT NULL
//   - create_user (character varying, max length: 10) NOT NULL  
//   - choose_sel (character, max length: 1) NOT NULL
//   - post_status (character, max length: 1) NOT NULL

// Table: wms_app_stock_take
// Columns:
//   - company (character varying, max length: 20) NOT NULL      
//   - entity_code (character varying, max length: 20) NOT NULL  
//   - stock_take_id (bigint) NOT NULL
//   - warehouse_code (character varying, max length: 20) NOT NULL
//   - location_code (character varying, max length: 20) NOT NULL
//   - sku_code (character varying, max length: 30) NOT NULL     
//   - sku_desc (character varying, max length: 100) NOT NULL    
//   - sku_qty (smallint) NOT NULL
//   - data_origin (character, max length: 1) NOT NULL
//   - create_date (date) NOT NULL
//   - create_user (character varying, max length: 10) NOT NULL  
//   - choose_sel (character, max length: 1) NOT NULL
//   - post_status (character, max length: 1) NOT NULL
//   - image_link1 (character varying, max length: 300) NULL     
//   - image_link2 (character varying, max length: 300) NULL     
//   - image_link3 (character varying, max length: 300) NULL     
//   - commodity (character varying, max length: 30) NULL        

// Table: wms_app_transfer
// Columns:
//   - company (character varying, max length: 20) NOT NULL      
//   - entity_code (character varying, max length: 20) NOT NULL  
//   - transfer_id (bigint) NOT NULL
//   - from_warehouse (character varying, max length: 20) NOT NULL
//   - to_warehouse (character varying, max length: 20) NOT NULL 
//   - from_location (character varying, max length: 20) NOT NULL
//   - source_type (character, max length: 1) NOT NULL
//   - source_value (character varying, max length: 30) NOT NULL 
//   - to_location (character varying, max length: 20) NOT NULL  
//   - target_type (character, max length: 1) NOT NULL
//   - target_value (character varying, max length: 30) NOT NULL 
//   - sku_code (character varying, max length: 30) NOT NULL     
//   - sku_qty (smallint) NOT NULL
//   - reference1 (character varying, max length: 20) NULL       
//   - create_date (date) NOT NULL
//   - create_user (character varying, max length: 10) NOT NULL  
//   - choose_sel (character, max length: 1) NOT NULL
//   - post_status (character, max length: 1) NOT NULL
//   - image_link1 (character varying, max length: 300) NULL     
//   - image_link2 (character varying, max length: 300) NULL     
//   - image_link3 (character varying, max length: 300) NULL     

// Table: wms_commodity
// Columns:
//   - company (character varying, max length: 20) NOT NULL      
//   - entity_code (character varying, max length: 20) NOT NULL  
//   - partner_code (character varying, max length: 20) NOT NULL 
//   - commodity (character varying, max length: 30) NOT NULL    
//   - create_user (character varying, max length: 10) NOT NULL  
//   - create_date (date) NOT NULL
//   - create_time (time without time zone) NOT NULL
//   - update_user (character varying, max length: 10) NOT NULL  
//   - update_date (date) NOT NULL
//   - update_time (time without time zone) NOT NULL

// Table: wms_location
// Columns:
//   - company (character varying, max length: 20) NOT NULL      
//   - entity_code (character varying, max length: 20) NOT NULL  
//   - warehouse_code (character varying, max length: 20) NOT NULL
//   - location_code (character varying, max length: 20) NOT NULL
//   - location_desc (character varying, max length: 20) NULL    
//   - location_type (character varying, max length: 10) NULL    
//   - pick_sequence (integer) NULL
//   - putaway_sequence (integer) NULL
//   - max_cbm (numeric) NULL
//   - max_weight (numeric) NULL
//   - max_pallet (integer) NOT NULL
//   - max_qty (double precision) NOT NULL
//   - used_space (numeric) NULL
//   - sku_category (character varying, max length: 20) NULL     
//   - create_user (character varying, max length: 10) NULL      
//   - create_date (date) NULL
//   - update_user (character varying, max length: 10) NULL      
//   - update_date (date) NULL
//   - location_active (character, max length: 1) NOT NULL       
//   - location_remarks (character varying, max length: 100) NULL

// Table: xwms_feedback
// Columns:
//   - company (character varying, max length: 20) NOT NULL      
//   - entity_code (character varying, max length: 20) NOT NULL  
//   - user_id (character varying, max length: 10) NOT NULL      
//   - user_email (character varying, max length: 100) NOT NULL  
//   - feedback_id (smallint) NOT NULL
//   - feedback_date (timestamp with time zone) NOT NULL
//   - feedback_subject (character varying, max length: 100) NULL
//   - feedback_description (text) NULL
//   - create_date (timestamp with time zone) NOT NULL

// Table: xwms_log
// Columns:
//   - company (character varying, max length: 20) NOT NULL      
//   - entity_code (character varying, max length: 20) NOT NULL  
//   - user_id (character varying, max length: 100) NOT NULL     
//   - log_id (bigint) NOT NULL
//   - log_date (timestamp with time zone) NOT NULL
//   - menu_id (character varying, max length: 50) NOT NULL      
//   - log_text (text) NOT NULL
//   - ip_config (character varying, max length: 20) NULL        
//   - ip_location (character varying, max length: 100) NULL     

// Table: xwms_organization
// Columns:
//   - company (character varying, max length: 20) NOT NULL      
//   - entity_code (character varying, max length: 20) NOT NULL  
//   - name (character varying, max length: 150) NOT NULL        
//   - address (character varying, max length: 300) NOT NULL     
//   - city (character varying, max length: 30) NOT NULL
//   - country (character varying, max length: 50) NOT NULL      
//   - postal_code (character varying, max length: 10) NOT NULL  
//   - phone (character varying, max length: 50) NULL
//   - contact (character varying, max length: 100) NULL
//   - email (character varying, max length: 100) NULL
//   - gst_reg (character varying, max length: 20) NULL
//   - api_key (character varying, max length: 200) NULL
//   - create_date (timestamp with time zone) NOT NULL
//   - update_date (timestamp with time zone) NOT NULL

// Table: xwms_signup
// Columns:
//   - name (character varying, max length: 100) NOT NULL        
//   - signup_id (smallint) NOT NULL
//   - company (character varying, max length: 100) NOT NULL     
//   - address (character varying, max length: 300) NOT NULL     
//   - country (character varying, max length: 100) NOT NULL     
//   - email (character varying, max length: 100) NOT NULL       
//   - phone (character varying, max length: 100) NOT NULL       

// Table: xwms_users
// Columns:
//   - company (character varying, max length: 20) NOT NULL      
//   - entity_code (character varying, max length: 20) NOT NULL  
//   - user_id (character varying, max length: 100) NOT NULL     
//   - user_name (character varying, max length: 100) NOT NULL   
//   - user_email (character varying, max length: 100) NOT NULL  
//   - user_pwd (character varying, max length: 20) NOT NULL     
//   - user_active (character varying, max length: 1) NOT NULL   
//   - valid_till (date) NOT NULL
//   - user_company (character varying, max length: 100) NOT NULL
//   - user_address (character varying, max length: 300) NULL    
//   - user_country (character varying, max length: 100) NULL    
//   - user_phone (character varying, max length: 50) NULL       
//   - admin_user (character varying, max length: 1) NOT NULL    
