#!/usr/bin/env swift
/**
 * macOS Vision 框架本地文字识别（OCR）。
 * 用法：swift RecognizeText.swift <image-path>
 * 成功：stdout 输出识别行；失败：stderr + 非 0 退出码。
 */
import Foundation
import Vision
import AppKit

guard CommandLine.arguments.count > 1 else {
    FileHandle.standardError.write(Data("usage: RecognizeText.swift <image-path>\n".utf8))
    exit(2)
}

let path = CommandLine.arguments[1]
guard FileManager.default.fileExists(atPath: path) else {
    FileHandle.standardError.write(Data("file_not_found\n".utf8))
    exit(1)
}

guard let image = NSImage(contentsOfFile: path),
      let tiff = image.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff),
      let cgImage = rep.cgImage else {
    FileHandle.standardError.write(Data("load_failed\n".utf8))
    exit(1)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true
if #available(macOS 13.0, *) {
    // 中英优先：覆盖截图、文档与混合界面
    request.recognitionLanguages = ["zh-Hans", "zh-Hant", "en-US"]
}

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
do {
    try handler.perform([request])
} catch {
    FileHandle.standardError.write(Data("perform_failed: \(error)\n".utf8))
    exit(1)
}

let lines = (request.results ?? []).compactMap { observation -> String? in
    observation.topCandidates(1).first?.string
}
print(lines.joined(separator: "\n"))
