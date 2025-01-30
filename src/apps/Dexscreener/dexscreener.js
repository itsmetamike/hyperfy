if (world.isClient) {
  // Configuration
  const UI_CONFIG = {
    // Base UI settings
    BASE_WIDTH: 750,
    BASE_HEIGHT: 450,
    BASE_SCALE: 0.004,
    
    // Container dimensions (in pixels)
    HEADER_HEIGHT: 80,
    GRID_HEIGHT: 80,
    CARD_WIDTH: 160,
    CARD_HEIGHT: 70,
    ADDRESS_HEIGHT: 40,
    
    // Spacing
    PADDING: 24,
    GRID_GAP: 12,
    SECTION_GAP: 16,
    
    // Font sizes
    TITLE_FONT_SIZE: 32,
    SUBTITLE_FONT_SIZE: 20,
    CARD_LABEL_FONT_SIZE: 12,
    CARD_VALUE_FONT_SIZE: 18,
    ADDRESS_FONT_SIZE: 12,

    // Display timeout in milliseconds
    DISPLAY_TIMEOUT: 5000
  };

  // Native token symbols for each chain
  const nativeTokens = {
    'solana': 'SOL',
    'ethereum': 'ETH',
    'bsc': 'BNB',
    'arbitrum': 'ETH',
    'polygon': 'MATIC',
    'avalanche': 'AVAX',
    'base': 'ETH'
  };

  // Get configuration values
  let config = app.config;
  let chain = config?.chain || null;
  let contractAddress = config?.contractAddress || null;
  let hideTimeout = null;

  // Get the GLB
  const myGlb = app.get('Cube');
  console.log('[DexScreener UI] Fetched glb:', myGlb);

  // CREATE THE UI
  const priceUI = app.create('ui');
  priceUI.width = UI_CONFIG.BASE_WIDTH;
  priceUI.height = UI_CONFIG.BASE_HEIGHT;
  priceUI.size = UI_CONFIG.BASE_SCALE;
  priceUI.pivot = 'center';
  priceUI.quaternion.set(0, 0.707, 0, 0.707);
  priceUI.position.set(0, 0, 0);
  priceUI.interactive = true; // Enable interaction at root

  // Main container
  const mainContainer = app.create('uiview');
  mainContainer.backgroundColor = '#000000';
  mainContainer.width = UI_CONFIG.BASE_WIDTH;
  mainContainer.height = UI_CONFIG.BASE_HEIGHT;
  mainContainer.padding = UI_CONFIG.PADDING;
  mainContainer.justifyContent = 'flex-start';
  mainContainer.alignItems = 'center';
  mainContainer.interactive = true; // Enable interaction

  // Content wrapper
  const contentWrapper = app.create('uiview');
  contentWrapper.width = UI_CONFIG.BASE_WIDTH - (2 * UI_CONFIG.PADDING);
  contentWrapper.height = UI_CONFIG.BASE_HEIGHT - (2 * UI_CONFIG.PADDING);
  contentWrapper.flexDirection = 'column';
  contentWrapper.gap = UI_CONFIG.SECTION_GAP;
  contentWrapper.interactive = true; // Enable interaction

  // Header container
  const headerContainer = app.create('uiview');
  headerContainer.flexDirection = 'row';
  headerContainer.width = contentWrapper.width;
  headerContainer.height = UI_CONFIG.HEADER_HEIGHT;
  headerContainer.justifyContent = 'space-between';
  headerContainer.interactive = true; // Enable interaction

  // Token section
  const tokenSection = app.create('uiview');
  tokenSection.flexDirection = 'column';
  tokenSection.alignItems = 'flex-start';
  tokenSection.width = contentWrapper.width / 2;
  tokenSection.height = UI_CONFIG.HEADER_HEIGHT;
  tokenSection.justifyContent = 'center';
  tokenSection.interactive = true; // Enable interaction

  const tokenName = app.create('uitext');
  tokenName.fontSize = UI_CONFIG.TITLE_FONT_SIZE;
  tokenName.color = '#FFFFFF';
  tokenName.fontWeight = 'bold';
  tokenName.value = 'ai16z';

  const tokenWebsite = app.create('uitext');
  tokenWebsite.fontSize = UI_CONFIG.SUBTITLE_FONT_SIZE;
  tokenWebsite.color = '#4A9EFF';
  tokenWebsite.value = 'elizaos.ai';
  tokenWebsite.cursor = 'pointer';

  tokenWebsite.onPointerDown = (event) => {
    window.open('https://elizaos.ai', '_blank');
    event.stopPropagation();
  };

  tokenWebsite.onPointerEnter = () => {
    document.body.style.cursor = 'pointer';
    tokenWebsite.color = '#6CB2FF';
  };

  tokenWebsite.onPointerLeave = () => {
    document.body.style.cursor = 'default';
    tokenWebsite.color = '#4A9EFF';
  };

  tokenSection.add(tokenName);
  tokenSection.add(tokenWebsite);

  // Price section
  const priceSection = app.create('uiview');
  priceSection.flexDirection = 'column';
  priceSection.alignItems = 'flex-end';
  priceSection.width = contentWrapper.width / 2;
  priceSection.height = UI_CONFIG.HEADER_HEIGHT;
  priceSection.justifyContent = 'center';
  priceSection.interactive = true; // Enable interaction

  const priceUsd = app.create('uitext');
  priceUsd.fontSize = UI_CONFIG.TITLE_FONT_SIZE;
  priceUsd.color = '#FFFFFF';
  priceUsd.fontWeight = 'bold';
  priceUsd.value = '$0.00';

  const priceSol = app.create('uitext');
  priceSol.fontSize = UI_CONFIG.SUBTITLE_FONT_SIZE;
  priceSol.color = '#808080';
  priceSol.value = '0.000000 SOL';

  priceSection.add(priceUsd);
  priceSection.add(priceSol);

  headerContainer.add(tokenSection);
  headerContainer.add(priceSection);

  // Grid helper
function createGrid() {
    const grid = app.create('uiview');
    grid.flexDirection = 'row';
    grid.gap = UI_CONFIG.GRID_GAP;
    grid.width = contentWrapper.width;
    grid.height = UI_CONFIG.GRID_HEIGHT;
    // Change from space-between to center
    grid.justifyContent = 'center';
    grid.alignItems = 'center';
    grid.interactive = true; // Enable interaction
    return grid;
}

  function createCard(label) {
    const card = app.create('uiview');
    card.backgroundColor = '#111111';
    card.padding = UI_CONFIG.PADDING / 2;
    card.borderRadius = 8;
    card.width = UI_CONFIG.CARD_WIDTH;
    card.height = UI_CONFIG.CARD_HEIGHT;
    card.alignItems = 'center';
    card.justifyContent = 'center';
    card.interactive = true; // Enable interaction

    const labelText = app.create('uitext');
    labelText.value = label;
    labelText.fontSize = UI_CONFIG.CARD_LABEL_FONT_SIZE;
    labelText.color = '#808080';
    labelText.textTransform = 'uppercase';
    card.add(labelText);

    return card;
  }

  const changes = {
    grid: createGrid(),
    cards: {}
  };

  const transactions = {
    grid: createGrid(),
    cards: {}
  };

  const stats = {
    grid: createGrid(),
    cards: {}
  };

  const timeframes = ['m5', 'h1', 'h6', 'h24'];

  // Changes grid
  timeframes.forEach(tf => {
    const card = createCard(`${tf} Change`);
    const value = app.create('uitext');
    value.fontSize = UI_CONFIG.CARD_VALUE_FONT_SIZE;
    value.fontWeight = 'bold';
    value.value = '0%';
    value.color = '#808080';
    card.add(value);
    changes.cards[tf] = value;
    changes.grid.add(card);
  });

  // Transactions grid
  timeframes.forEach(tf => {
    const card = createCard(`${tf} Transactions`);
    const container = app.create('uiview');
    container.flexDirection = 'row';
    container.gap = UI_CONFIG.GRID_GAP;
    container.height = UI_CONFIG.CARD_HEIGHT - UI_CONFIG.PADDING;
    container.justifyContent = 'center';
    container.alignItems = 'center';
    container.interactive = true; // Enable interaction

    const buys = app.create('uitext');
    buys.fontSize = UI_CONFIG.CARD_VALUE_FONT_SIZE;
    buys.color = '#4ADE80';
    buys.fontWeight = 'bold';
    buys.value = '0';

    const sells = app.create('uitext');
    sells.fontSize = UI_CONFIG.CARD_VALUE_FONT_SIZE;
    sells.color = '#EF4444';
    sells.fontWeight = 'bold';
    sells.value = '0';

    container.add(buys);
    container.add(sells);
    card.add(container);

    transactions.cards[tf] = { buys, sells };
    transactions.grid.add(card);
  });

  // Stats grid
  const statsData = [
    { label: 'Liquidity', value: '$0' },
    { label: 'Market Cap', value: '$0' },
    { label: 'FDV', value: '$0' }
  ];

  statsData.forEach(({ label, value }) => {
    const card = createCard(label);
    const valueText = app.create('uitext');
    valueText.fontSize = UI_CONFIG.CARD_VALUE_FONT_SIZE;
    valueText.color = '#FFFFFF';
    valueText.fontWeight = 'bold';
    valueText.value = value;
    card.add(valueText);
    stats.cards[label] = valueText;
    stats.grid.add(card);
  });

  // Contract address
  const addressSection = app.create('uiview');
  addressSection.height = UI_CONFIG.ADDRESS_HEIGHT;
  addressSection.width = contentWrapper.width;
  addressSection.justifyContent = 'center';
  addressSection.alignItems = 'center';
  addressSection.interactive = true; // Enable interaction

  const contractAddressText = app.create('uitext');
  contractAddressText.fontSize = UI_CONFIG.ADDRESS_FONT_SIZE;
  contractAddressText.color = '#4A5568';
  contractAddressText.value = contractAddress ? `CA: ${contractAddress} (${chain.toUpperCase()})` : 'CA: Loading...';
  
  addressSection.add(contractAddressText);

  // Add logo section
  const logoSection = app.create('uiview');
  logoSection.height = 80;
  logoSection.width = contentWrapper.width;
  logoSection.justifyContent = 'center';
  logoSection.alignItems = 'center';
  logoSection.marginTop = 12;
  logoSection.flexDirection = 'row';
  logoSection.gap = 24;
  logoSection.backgroundColor = '#111111';
  logoSection.interactive = true; // Enable interaction
  logoSection.onPointerDown = () => {
    console.log('clicked parent container');
  };

  // Function to create a logo element
  function createLogoElement(config, url) {
    // Create container for the logo (child container)
    const logoContainer = app.create('uiview');
    logoContainer.width = 60;
    logoContainer.height = 60;
    logoContainer.backgroundColor = 'blue';
    logoContainer.justifyContent = 'center';
    logoContainer.alignItems = 'center';
    logoContainer.alignContent = 'center';
    logoContainer.visible = false;
    logoContainer.interactive = true; // Enable interaction

    // Create the actual image
    const logo = app.create('uiimage');
    logo.width = 40;
    logo.height = 40;
    logo.src = config.image;
    logo.objectFit = 'cover';

    // Match example's child handler exactly
    logoContainer.onPointerDown = (e) => {
      e.stopPropagation();
      console.log('clicked child container');
      if (url) {
        window.open(url, '_blank');
      }
    };

    // Add image to container
    logoContainer.add(logo);
    
    // Store and add to section
    logoElements[config.type] = logoContainer;
    logoSection.add(logoContainer);
    return logoContainer;
  }

  // Function to update logos based on available links
  function updateLogos(websites = []) {
    console.log('Updating logos with websites:', websites);
    // Hide all logos first
    Object.values(logoElements).forEach(container => {
      container.visible = false;
    });

    // Show and update logos based on available links
    websites.forEach(url => {
      for (const config of socialConfigs) {
        if (config.urlPattern.test(url)) {
          const container = logoElements[config.type];
          if (container) {
            container.visible = true;
            // Match example's child handler exactly
            container.onPointerDown = (e) => {
              e.stopPropagation();
              console.log('clicked child container');
              window.open(url, '_blank');
            };
            break;
          }
        }
      }
    });
  }

  // Define social media configs with priority order
  const socialConfigs = [
    {
      type: 'website',
      image: 'web.png',
      urlPattern: /^https?:\/\//
    },
    {
      type: 'twitter',
      image: 'x.png',
      urlPattern: /twitter\.com|x\.com/
    },
    {
      type: 'discord',
      image: 'discord.png',
      urlPattern: /discord\.(gg|com)/
    },
    {
      type: 'telegram',
      image: 'telegram.png',
      urlPattern: /t\.me|telegram\./
    }
  ];

  // Store logo UI elements to update them later
  const logoElements = {};

  // Create all possible logo elements
  socialConfigs.forEach(config => {
    createLogoElement(config, '');
  });

  // Assemble the UI hierarchy
  contentWrapper.add(headerContainer);
  contentWrapper.add(changes.grid);
  contentWrapper.add(transactions.grid);
  contentWrapper.add(stats.grid);
  contentWrapper.add(addressSection);
  contentWrapper.add(logoSection);
  mainContainer.add(contentWrapper);
  priceUI.add(mainContainer);

  // Attach to GLB
  if (myGlb) {
    world.attach(myGlb);
    myGlb.add(priceUI);
    console.log('[DexScreener UI] UI attached to GLB');
  } else {
    world.add(priceUI);
    console.log('[DexScreener UI] UI attached to world');
  }

  // Function to show UI
  function showUI(address, chainId) {
    console.log('[DexScreener] Showing UI for', address, 'on chain', chainId);
    
    // Clear any existing hide timeout
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }

    // Update contract and chain
    contractAddress = address;
    chain = chainId;

    // Show the UI
    priceUI.visible = true;
    console.log('[DexScreener] UI visibility set to:', priceUI.visible);

    // Set timeout to hide
    hideTimeout = setTimeout(() => {
      priceUI.visible = false;
      console.log('[DexScreener] UI hidden by timeout');
    }, UI_CONFIG.DISPLAY_TIMEOUT);
  }

  // Initially hide the UI
  priceUI.visible = false;
  console.log('[DexScreener] Initial UI visibility:', priceUI.visible);

  // Listen for chat messages
  world.on('chat', (msg) => {
    console.log('[DexScreener] Got chat message:', msg);
    
    // Skip system messages
    if (!msg.from) {
      console.log('[DexScreener] Skipping system message');
      return;
    }

    // Parse command
    const args = msg.body.split(" ").map((word) => word.toLowerCase());
    const rawCmd = args.shift();
    const cmd = rawCmd.startsWith('/') ? rawCmd.slice(1) : rawCmd;
    
    console.log('[DexScreener] Processing command:', { cmd, args });
    
    if (cmd === "ca") {
      const address = args[0];
      if (!address) {
        console.log('[DexScreener] No address provided');
        return;
      }
      
      // Detect chain from address format
      const chains = {
        'solana': /^[A-Za-z0-9]{32,44}$/,
        'ethereum': /^0x[a-fA-F0-9]{40}$/,
        'bsc': /^0x[a-fA-F0-9]{40}$/,
        'arbitrum': /^0x[a-fA-F0-9]{40}$/,
        'polygon': /^0x[a-fA-F0-9]{40}$/,
        'avalanche': /^0x[a-fA-F0-9]{40}$/,
        'base': /^0x[a-fA-F0-9]{40}$/
      };

      console.log('[DexScreener] Testing address:', address);
      let detectedChain = null;
      for (const [chain, pattern] of Object.entries(chains)) {
        console.log(`[DexScreener] Testing ${chain} pattern:`, pattern.toString());
        if (pattern.test(address)) {
          console.log(`[DexScreener] Matched ${chain} pattern!`);
          detectedChain = chain;
          break;
        }
      }

      if (detectedChain) {
        console.log('[DexScreener] Showing UI for:', { address, chain: detectedChain });
        
        // Update global values
        chain = detectedChain;
        contractAddress = address;
        
        // Show UI and trigger first data fetch
        showUI(address, detectedChain);
        fetchDexData();
      }
    }
  });

  // Data fetching
  let frameCount = 0;
  const FRAMES_BETWEEN_UPDATES = 300;

  function formatValue(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  }

  async function fetchDexData() {
    // Skip if we don't have chain and address
    if (!chain || !contractAddress) {
      console.log('[DexScreener] Skipping fetch - missing chain or address:', { chain, contractAddress });
      return;
    }

    frameCount++;
    if (frameCount < FRAMES_BETWEEN_UPDATES) return;
    frameCount = 0;

    try {
      console.log('[DexScreener] Fetching data for:', { chain, contractAddress });
      const response = await fetch(`/api/dexscreener?chain=${chain}&contractAddress=${contractAddress}`);
      const text = await response.text();
      
      if (!response.ok) {
        console.error(`[DexScreener] API Error ${response.status}:`, text);
        return;
      }
      
      const data = JSON.parse(text);
      if (!data.pairs?.[0]) {
        console.error('[DexScreener] Invalid API response format:', data);
        return;
      }

      const pair = data.pairs[0];
      console.log('[DexScreener] Got pair data:', pair);
      
      // Update token info
      tokenName.value = pair.baseToken.name;
      tokenWebsite.value = pair.info.websites?.[0]?.url.replace('https://', '') || '';
      
      // Update social links
      const websites = [
        ...(pair.info.websites || []).map(w => w.url),
        ...(pair.info.social || []).map(s => s.url)
      ];
      updateLogos(websites);

      // Get native token symbol for the current chain
      const nativeToken = nativeTokens[chain.toLowerCase()] || 'TOKEN';
      
      // Update prices
      priceUsd.value = `$${Number(pair.priceUsd || 0).toFixed(4)}`;
      priceSol.value = `${pair.priceNative || 0} ${nativeToken}`;

      // Update changes and transactions
      timeframes.forEach(tf => {
        const change = Number(pair.priceChange[tf] || 0);
        changes.cards[tf].value = `${change.toFixed(2)}%`;
        changes.cards[tf].color = change >= 0 ? '#4ADE80' : '#EF4444';

        const txData = pair.txns[tf];
        transactions.cards[tf].buys.value = txData.buys.toString();
        transactions.cards[tf].sells.value = txData.sells.toString();
      });

      // Update stats
      stats.cards['Liquidity'].value = `$${formatValue(Number(pair.liquidity.usd))}`;
      stats.cards['Market Cap'].value = `$${formatValue(Number(pair.marketCap))}`;
      stats.cards['FDV'].value = `$${formatValue(Number(pair.fdv))}`;

      // Update contract address
      contractAddressText.value = `CA: ${contractAddress} (${chain.toUpperCase()})`;
    } catch (err) {
      console.error('[DexScreener] Error fetching Dex data:', err);
    }
  }

  // Only update on animation frame if we have data to fetch
  app.on('update', () => {
    if (chain && contractAddress) {
      fetchDexData();
    }
  });
}