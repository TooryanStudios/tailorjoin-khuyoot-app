# Update DesignerV2_1.tsx to wire components properly
$file = "src/pages/DesignerV2_1/DesignerV2_1.tsx"
$c = Get-Content $file -Raw

# Already done: Replace </aside> with </LeftSidebar>
# Already done: Replace <aside with <LeftSidebar opening

# Now we need to add the full LeftSidebar opening with all props
# First find where the first </div> after opening LeftSidebar is, and add all the props

$leftsidebarProps = @"
          t={t}
          features={features}
          uiState={uiState}
          sidebarHasVisibleContent={sidebarHasVisibleContent}
          templateInputRef={templateInputRef}
          fabricInputRef={fabricInputRef}
          sourcePreviewUrl={sourcePreviewUrl}
          fabricPreviewUrl={fabricPreviewUrl}
          onOpenUserImagePrep={openUserImagePrep}
          onOpenFabricPrep={openFabricPrep}
          onOpenFabricTiling={() => setFabricTilingOpen(true)}
          onTemplateSelect={handleTemplateSelect}
          fabricMaterial={fabricMaterial}
          onFabricMaterialChange={setFabricMaterial}
          isProcessing={isProcessing}
          creditsEnabled={creditsEnabled}
          generationCost={generationCost}
          onGenerate={handleFabricSwap}
          isSubscribed={isSubscribed}
          canAfford={canAfford}
          openUpgradeModal={openUpgradeModal}
          selectedTemplate={selectedTemplate}
          isLoadingProduct={isLoadingProduct}
          loadingTemplateId={loadingTemplateId}
          setLastActiveTemplateTab={setLastActiveTemplateTab}
          isPrivacyMode={isPrivacyMode}
          setPrivacyMode={setPrivacyMode}
          isProcessingTemplate={isProcessingTemplate}
          isProcessingFabric={isProcessingFabric}
          isProcessingPrivacy={isProcessingPrivacy}
          maskingStyle={maskingStyle}
          setMaskingStyle={setMaskingStyle}
          blurStrength={blurStrength}
          setBlurStrength={setBlurStrength}
          selectedEmoji={selectedEmoji}
          setSelectedEmoji={setSelectedEmoji}
          upscaleEngine={upscaleEngine}
          setUpscaleEngine={setUpscaleEngine}
          outputFit={outputFit}
          setOutputFit={setOutputFit}
          handleUpscale={handleUpscale}
          isUpscaling={isUpscaling}
          upscaleProgress={upscaleProgress}
          upscaleCost={upscaleCost}
          isWatermarkEnabled={isWatermarkEnabled}
          setIsWatermarkEnabled={setIsWatermarkEnabled}
          traceStep={traceStep}
          user={user}
          lastRequestDebug={lastRequestDebug}
          lastResponseDebug={lastResponseDebug}
          isWatermarkDisabled={uiState.watermarkDisabled}
        >
"@

# Replace <LeftSidebar with <LeftSidebar + props
$c = [regex]::Replace($c, '<LeftSidebar\n\s+\{/\*', "<LeftSidebar`n$leftsidebarProps`n          {/*", 1)

# Now replace DesignerHeader with TopBar
$topbarReplacement = @"
<TopBar
          t={t}
          user={user}
          onHome={navigateHome}
          onClearSelections={handleClearSelections}
          clearDisabled={uiState.inputsDisabled || (!sourceForComparison && !afterImage && !fabricPreviewUrl && !selectedTemplate?.id)}
          isAdminUser={isAdminUser}
          debugPanelOpen={debugPanelOpen}
          onOpenDebug={() => setDebugPanelOpen(true)}
          onRefillCredits={() => {
            traceStep('designer_v2_refill_click', { context: 'desktop_badge', user: user?.uid || 'unknown' });
            openUpgradeModal('upgrade_button_main');
          }}
          navigateProfile={navigateProfile}
        />
"@

$c = [regex]::Replace($c, '<DesignerHeader\s+onHome=\{navigateHome\}\s+rightSlot=\{[\s\S]*?\}\s+/>', $topbarReplacement, 1)

# Save the file
Set-Content $file $c
Write-Host "Successfully updated DesignerV2_1.tsx"
